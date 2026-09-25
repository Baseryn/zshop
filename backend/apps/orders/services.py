"""Business services and Domain Event listeners for Orders.

Demonstrates:
- UnitOfWork coordinating multi-repository transactions (Order + Stock reduction).
- UnitOfWork.register_event ensuring events are only dispatched after successful commit.
- @on_event decorator capturing post-commit domain occurrences.
"""

import uuid
from decimal import Decimal
from typing import Any

import structlog
from zcore import BaseService, EventDispatcher, UnitOfWork, on_event
from zcore.exceptions import EntityNotFound, ValidationError

from apps.catalog.repositories import ProductRepository

from .models import OrderItems, Orders, OrderStatus
from .repositories import OrderItemRepository, OrderRepository
from .schemas import OrderCreate, OrderStatusUpdate
from .tasks import generate_invoice_and_notify_customer

logger = structlog.get_logger("zshop.orders")


class OrderService(BaseService[Orders]):
    """Service orchestrating atomic order placements, payments, and state transitions."""

    def __init__(
        self,
        repository: OrderRepository,
        item_repository: OrderItemRepository,
        product_repository: ProductRepository,
        dispatcher: EventDispatcher,
    ):
        super().__init__(model=Orders, repository=repository)
        self.item_repository = item_repository
        self.product_repository = product_repository
        self.dispatcher = dispatcher

    async def place_order(self, user_id: uuid.UUID, schema: OrderCreate) -> Orders:
        """Place an order atomically using ZCore's UnitOfWork.
        
        Validates inventory for every item, decrements product stock, computes totals,
        persists the order aggregate, and registers domain events for post-commit dispatch.
        """
        # Execute entire multi-step process inside UnitOfWork
        async with UnitOfWork(session=self.repository.db, dispatcher=self.dispatcher) as uow:
            total_amount = Decimal("0.00")
            order_items_to_create: list[OrderItems] = []

            # 1. Validate items and atomically reserve product stock
            for item_in in schema.items:
                product = await self.product_repository.get(id=item_in.product_id)
                if not product or not product.is_active:
                    raise EntityNotFound(
                        message=f"Product with id '{item_in.product_id}' is unavailable."
                    )

                if product.stock_quantity < item_in.quantity:
                    raise ValidationError(
                        message=(
                            f"Insufficient stock for '{product.name}'. "
                            f"Requested: {item_in.quantity}, Available: {product.stock_quantity}"
                        )
                    )

                # Atomically decrement inventory in catalog
                product.stock_quantity -= item_in.quantity

                subtotal = product.price * item_in.quantity
                total_amount += subtotal

                order_item = OrderItems(
                    product_id=product.id,
                    unit_price=product.price,
                    quantity=item_in.quantity,
                    subtotal=subtotal,
                )
                order_items_to_create.append(order_item)

            # 2. Persist order header
            new_order = Orders(
                user_id=user_id,
                status=OrderStatus.PENDING,
                total_amount=total_amount,
                shipping_address=schema.shipping_address,
                items=order_items_to_create,
            )
            self.repository.db.add(new_order)
            await self.repository.db.flush()
            await self.repository.db.refresh(new_order)

            # 3. Register domain event (dispatched ONLY if UoW commits successfully!)
            uow.register_event(
                "order.created",
                {
                    "order_id": str(new_order.id),
                    "user_id": str(new_order.user_id),
                    "total_amount": str(new_order.total_amount),
                },
            )

        return new_order

    async def update_status(self, order_id: uuid.UUID, data_in: OrderStatusUpdate) -> Orders:
        """Transition order state and emit 'order.status_changed' event."""
        async with UnitOfWork(session=self.repository.db, dispatcher=self.dispatcher) as uow:
            order = await self.get(id=order_id)
            old_status = order.status
            order.status = data_in.status
            if data_in.tracking_code:
                order.tracking_code = data_in.tracking_code

            await self.repository.db.flush()

            uow.register_event(
                "order.status_changed",
                {
                    "order_id": str(order.id),
                    "user_id": str(order.user_id),
                    "old_status": old_status.value,
                    "new_status": order.status.value,
                },
            )

        return order


class OrderNotificationListener:
    """Event subscriber listening to domain occurrences dispatched by UnitOfWork."""

    @on_event("order.created")
    async def handle_order_created(self, payload: dict[str, Any]) -> None:
        """Respond to successful order placement by scheduling background processing."""
        order_id = uuid.UUID(payload["order_id"])
        logger.info("Captured 'order.created' domain event", order_id=str(order_id))

        # Launch background task with isolated IoC container scope and DB session
        await generate_invoice_and_notify_customer(order_id=order_id)

    @on_event("order.status_changed")
    async def handle_status_changed(self, payload: dict[str, Any]) -> None:
        """Respond to order status modifications."""
        logger.info(
            "Captured 'order.status_changed' domain event",
            order_id=payload["order_id"],
            new_status=payload["new_status"],
        )