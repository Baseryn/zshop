"""Pydantic V2 schemas for Order data transfer.

Utilizes ZCore's Zchema base class for contextual field masking.
"""

import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field
from zcore import Zchema, ZDateTime

from .enums import OrderStatus

# ==========================================
# Order Item Schemas
# ==========================================

class OrderItemBase(Zchema):
    """Base schema for order line items."""
    __model__ = "order_items"

    product_id: uuid.UUID
    quantity: int = Field(gt=0, description="Purchased quantity (must be at least 1)")


class OrderItemCreate(OrderItemBase):
    """Payload schema for an item inside an order creation request."""
    pass


class OrderItemResponse(OrderItemBase):
    """Presentation schema for a purchased order item."""
    id: uuid.UUID
    order_id: uuid.UUID
    unit_price: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Order Aggregate Schemas
# ==========================================

class OrderBase(Zchema):
    """Base order attributes mapped to the 'orders' domain."""
    __model__ = "orders"

    shipping_address: str = Field(min_length=5, max_length=500)


class OrderCreate(OrderBase):
    """Payload schema submitted by a customer to place an order."""
    items: list[OrderItemCreate] = Field(min_length=1, description="List of items to purchase")


class OrderUpdate(Zchema):
    """Administrative payload schema for updating order fulfillment state."""
    __model__ = "orders"

    status: OrderStatus | None = None
    tracking_code: str | None = Field(default=None, max_length=100)
    shipping_address: str | None = None


class OrderStatusUpdate(BaseModel):
    """Targeted status transition schema."""
    status: OrderStatus
    tracking_code: str | None = None


class OrderResponse(OrderBase):
    """Full order presentation schema."""
    id: uuid.UUID
    user_id: uuid.UUID
    status: OrderStatus
    total_amount: Decimal
    tracking_code: str | None = None
    created_at: ZDateTime
    updated_at: ZDateTime
    items: list[OrderItemResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)