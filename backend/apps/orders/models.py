"""Database models for the Orders domain.

Defines Orders and OrderItems, implementing SoftDeleteMixin,
order lifecycle states, and foreign key relations with customer and catalog models.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from zcore import Base, SoftDeleteMixin

from .enums import OrderStatus


class Orders(Base, SoftDeleteMixin):
    """Aggregate Root representing a customer's purchase order.
    
    Tied to the user who placed it and contains detailed financial totals.
    """

    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, native_enum=False, length=20),
        default=OrderStatus.PENDING,
        index=True,
    )

    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    shipping_address: Mapped[str] = mapped_column(Text)
    tracking_code: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    items: Mapped[list["OrderItems"]] = relationship(
        "OrderItems",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class OrderItems(Base):
    """Entity representing a specific product line within an order."""

    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"),
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"),
        index=True,
    )

    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2))

    order: Mapped[Orders] = relationship(
        "Orders",
        back_populates="items",
    )