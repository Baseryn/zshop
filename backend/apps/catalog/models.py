"""Database models for the Catalog domain.

Defines Categories and Products, incorporating SoftDeleteMixin for recovery
and relationships optimized for ZCore's SearchEngine preloading.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from zcore import Base, SoftDeleteMixin


class Categories(Base, SoftDeleteMixin):
    """Category classification entity.
    
    Supports self-referencing hierarchy and automatic cascade soft-delete scoping.
    """

    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    parent: Mapped["Categories | None"] = relationship(
        "Categories",
        remote_side=[id],
        back_populates="subcategories",
    )
    subcategories: Mapped[list["Categories"]] = relationship(
        "Categories",
        back_populates="parent",
        lazy="selectin",
    )
    products: Mapped[list["Products"]] = relationship(
        "Products",
        back_populates="category",
        lazy="selectin",
    )


class Products(Base, SoftDeleteMixin):
    """Product entity showcasing data protection via ZCore's Zchema.
    
    Attributes like 'cost_price' and 'supplier_notes' are sensitive and will be
    pruned dynamically based on ctx.restricted_fields for non-privileged users.
    """

    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"),
        index=True,
    )
    name: Mapped[str] = mapped_column(String(200), index=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    sku: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    cost_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))  # Sensitive business margin!
    supplier_notes: Mapped[str | None] = mapped_column(Text, nullable=True)  # Sensitive!

    stock_quantity: Mapped[int] = mapped_column(default=0)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    category: Mapped[Categories] = relationship(
        "Categories",
        back_populates="products",
        lazy="joined",
    )