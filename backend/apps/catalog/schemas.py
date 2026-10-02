"""Pydantic V2 schemas for Catalog models.

Showcases contextual security pruning with Zchema: sensitive fields
like 'cost_price' and 'supplier_notes' are automatically stripped during
serialization and input parsing when listed in ctx.restricted_fields.
"""

import uuid
from decimal import Decimal

from pydantic import ConfigDict, Field
from zcore import Zchema, ZDateTime

# ==========================================
# Category Schemas
# ==========================================

class CategoryBase(Zchema):
    """Base category attributes."""
    __model__ = "categories"

    name: str = Field(max_length=100)
    description: str | None = Field(default=None, max_length=255)
    parent_id: uuid.UUID | None = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    """Payload for category creation."""
    pass


class CategoryUpdate(Zchema):
    """Payload for updating category information."""
    __model__ = "categories"

    name: str | None = Field(default=None, max_length=100)
    description: str | None = None
    parent_id: uuid.UUID | None = None
    is_active: bool | None = None


class CategoryResponse(CategoryBase):
    """Standard category presentation schema."""
    id: uuid.UUID
    slug: str
    created_at: ZDateTime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Product Schemas
# ==========================================

class ProductBase(Zchema):
    """Base product attributes.
    
    'cost_price' and 'supplier_notes' demonstrate automatic contextual pruning.
    """
    __model__ = "products"

    category_id: uuid.UUID
    name: str = Field(max_length=200)
    sku: str = Field(max_length=50)
    description: str | None = None
    price: Decimal = Field(gt=0, decimal_places=2)
    cost_price: Decimal = Field(gt=0, decimal_places=2)  # Business cost (Restricted)
    supplier_notes: str | None = None  # Internal note (Restricted)
    stock_quantity: int = Field(ge=0, default=0)
    image_url: str | None = None
    is_active: bool = True


class ProductCreate(ProductBase):
    """Payload for product creation."""
    pass


class ProductUpdate(Zchema):
    """Payload for modifying product details."""
    __model__ = "products"

    category_id: uuid.UUID | None = None
    name: str | None = Field(default=None, max_length=200)
    sku: str | None = Field(default=None, max_length=50)
    description: str | None = None
    price: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    cost_price: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    supplier_notes: str | None = None
    stock_quantity: int | None = Field(default=None, ge=0)
    image_url: str | None = None
    is_active: bool | None = None


class ProductResponse(ProductBase):
    """Full product presentation schema."""
    id: uuid.UUID
    slug: str
    created_at: ZDateTime
    updated_at: ZDateTime
    category: CategoryResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class ProductLookupResponse(Zchema):
    """Minimal projection schema for BaseRouter LOOKUP endpoint.
    
    Provides lightweight entity data for dropdowns, autocomplete, and order items.
    """
    __model__ = "products"

    id: uuid.UUID
    name: str
    sku: str
    price: Decimal
    stock_quantity: int
    image_url: str | None = None

    model_config = ConfigDict(from_attributes=True)