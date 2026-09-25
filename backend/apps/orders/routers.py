"""API Routers for the Orders module.

Strictly decoupled from other domain modules in adherence to Modular Monolith
principles. Utilizes ZCore's UserProtocol, get_current_user_stub, and ctx
instead of concrete identity implementations.
"""

import uuid
from typing import Annotated, Any, ClassVar

from fastapi import Depends, status
from zcore import (
    BaseRouter,
    CursorPagination,
    HasScopes,
    Inject,
    ResponseWrapper,
    RouteKey,
    UserProtocol,
)
from zcore.context.context import ctx
from zcore.exceptions import ForbiddenError
from zcore.security.dependencies import get_current_user_stub

from .models import Orders
from .schemas import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
    OrderUpdate,
)
from .services import OrderService

# Decoupled Framework-level Dependency Annotation (No cross-module import!)
AuthenticatedUser = Annotated[UserProtocol, Depends(get_current_user_stub)]


class OrderRouter(BaseRouter[OrderCreate, OrderUpdate]):
    """Decoupled Order Router with customer-level scoping and Keyset Cursor Pagination."""

    model = Orders
    create_schema = OrderCreate
    update_schema = OrderUpdate
    schema_out = OrderResponse
    service = OrderService
    pagination_class = CursorPagination
    prefix = "/orders"
    tags: ClassVar[list[str]] = ["Orders"]

    def get_route_dependencies(self, route_key: RouteKey, action: str) -> list[Any]:
        """Automatically bind RBAC scopes generated for the Orders domain.
        
        Uses BaseRouter's built-in HasScopes(action) without hard-coding auth dependencies.
        """
        return [HasScopes(action)]

    async def create_endpoint(self, data_in: OrderCreate, service: OrderService) -> ResponseWrapper:
        """Place an order bound to the current authenticated context."""
        user_id = ctx.user_id
        if not user_id:
            raise ForbiddenError(message="Authentication required to place orders.")

        order = await service.place_order(user_id=user_id, schema=data_in)
        return ResponseWrapper(data=order, message="Order placed successfully.")

    async def get_endpoint(self, id: Any, service: OrderService) -> ResponseWrapper:
        """Enforce customer data isolation using ZContext attributes."""
        order = await service.get(id=id)

        # Check privileges via context without coupling to identity models
        is_staff = ctx.get("is_staff", False)
        is_superuser = ctx.get("is_superuser", False)

        if not (is_staff or is_superuser) and order.user_id != ctx.user_id:
            raise ForbiddenError(message="You are not authorized to view this order.")

        return ResponseWrapper(data=order)


order_router_instance = OrderRouter()


# Administrative Status Transition Endpoint protected by domain scope
@order_router_instance.router.patch(
    "/{id}/status",
    status_code=status.HTTP_200_OK,
    response_model=ResponseWrapper[OrderResponse],
    dependencies=[Depends(HasScopes("orders:update"))],
    summary="Update Order Fulfillment Status",
)
async def update_order_status(
    id: uuid.UUID,
    status_in: OrderStatusUpdate,
    service: Inject[OrderService] = None,
):
    """Admin-facing endpoint updating order status and emitting post-commit events."""
    updated_order = await service.update_status(order_id=id, data_in=status_in)
    return ResponseWrapper(
        data=updated_order,
        message=f"Order status updated to '{status_in.status.value}'.",
    )