"""Business services and Domain Event listeners for the Orders domain.

Fully decoupled using Protocols and ZCore's IoC Container and UnitOfWork.
"""

import uuid
from decimal import Decimal
from typing import Any

import structlog
from zcore import BaseService, EventDispatcher, UnitOfWork, on_event
from zcore.exceptions import EntityNotFound, ValidationError

from contracts.catalog import ProductContract

from .models import OrderItems, Orders, OrderStatus
from .repositories import OrderItemRepository, OrderRepository
from .schemas import OrderCreate, OrderStatusUpdate
from .tasks import generate_invoice_and_notify_customer

logger = structlog.get_logger("zshop.orders")


class OrderService(BaseService[Orders]):
    """Service orchestrating atomic order transactions and state changes."""

    def __init__(
        self,
        repository: OrderRepository,
        item_repository: OrderItemRepository,
        inventory_service: ProductContract,
        dispatcher: EventDispatcher,
    ):
        super().__init__(model=Orders, repository=repository)
        self.item_repository = item_repository
        self.inventory_service = inventory_service
        self.dispatcher = dispatcher

    async def place_order(self, user_id: uuid.UUID, schema: OrderCreate) -> Orders:
        """Place an order atomically using UnitOfWork and InventoryContract.

        Guarantees that order creation and stock decrements commit or rollback together.
        """
        async with UnitOfWork(session=self.repository.db, dispatcher=self.dispatcher) as uow:
            total_amount = Decimal("0.00")
            order_items_to_create: list[OrderItems] = []

            for item_in in schema.items:
                product = await self.inventory_service.get(id=item_in.product_id)
                if not product or not getattr(product, "is_active", True):
                    raise EntityNotFound(
                        message=f"Product with id '{item_in.product_id}' is unavailable."
                    )

                available_stock = getattr(product, "stock_quantity", 0)
                if available_stock < item_in.quantity:
                    raise ValidationError(
                        message=(
                            f"Insufficient stock for '{product.name}'. "
                            f"Requested: {item_in.quantity}, Available: {available_stock}"
                        )
                    )

                await self.inventory_service.adjust_stock(
                    product_id=item_in.product_id,
                    quantity_delta=-item_in.quantity,
                )

                subtotal = product.price * item_in.quantity
                total_amount += subtotal

                order_item = OrderItems(
                    product_id=product.id,
                    unit_price=product.price,
                    quantity=item_in.quantity,
                    subtotal=subtotal,
                )
                order_items_to_create.append(order_item)

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

            # Register domain event dispatched only after successful database commit
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
        """Transition order status and emit 'order.status_changed' event."""
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

        return await self.get(id=order_id)


class OrderNotificationListener:
    """Event subscriber reacting to post-commit domain occurrences."""

    @on_event("order.created")
    async def handle_order_created(self, payload: dict[str, Any]) -> None:
        """Schedule isolated background tasks upon order placement."""
        order_id = uuid.UUID(payload["order_id"])
        logger.info("Captured 'order.created' domain event", order_id=str(order_id))
        await generate_invoice_and_notify_customer(order_id=order_id)

    @on_event("order.status_changed")
    async def handle_status_changed(self, payload: dict[str, Any]) -> None:
        """React to order status modifications."""
        logger.info(
            "Captured 'order.status_changed' domain event",
            order_id=payload["order_id"],
            new_status=payload["new_status"],
        )