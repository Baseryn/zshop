"""Catalog API Routers.

Demonstrates BaseRouter with Keyset Cursor Pagination, custom Public Read permissions,
dynamic schema pruning exposure (?schema=true), and secure binary uploads.
"""

import uuid
from typing import ClassVar

from fastapi import File, UploadFile, status
from zcore import (
    BaseRouter,
    CursorPagination,
    Inject,
    PageNumberPagination,
    ResponseWrapper,
)

from .models import Categories, Products
from .schemas import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    ProductCreate,
    ProductLookupResponse,
    ProductResponse,
    ProductUpdate,
)
from .services import CategoryService, ProductService


class CategoryRouter(BaseRouter[CategoryCreate, CategoryUpdate]):
    """Category CRUD Router with PageNumberPagination."""

    model = Categories
    create_schema = CategoryCreate
    update_schema = CategoryUpdate
    schema_out = CategoryResponse
    service = CategoryService
    pagination_class = PageNumberPagination
    prefix = "/categories"
    tags: ClassVar = ["Categories"]


class ProductRouter(BaseRouter[ProductCreate, ProductUpdate]):
    """Advanced Product Router.

    Showcases Keyset Cursor Pagination, lightweight lookup projections, and dynamic schema exposure.
    """

    model = Products
    create_schema = ProductCreate
    update_schema = ProductUpdate
    schema_out = ProductResponse
    lookup_schema = ProductLookupResponse
    service = ProductService
    pagination_class = CursorPagination
    prefix = "/products"
    tags: ClassVar = ["Products"]
    expose_schemas = True


category_router_instance = CategoryRouter()
product_router_instance = ProductRouter()


@product_router_instance.router.post(
    "/{id}/image",
    status_code=status.HTTP_200_OK,
    response_model=ResponseWrapper[ProductResponse],
    summary="Upload Product Cover Image",
)
async def upload_product_image(
    id: uuid.UUID,
    service: Inject[ProductService],
    file: UploadFile = File(...),
):
    """Upload product image passing through Magic-Bytes inspection and file validation."""
    updated_product = await service.upload_product_image(product_id=id, file=file)
    return ResponseWrapper(
        data=updated_product,
        message="Product image uploaded successfully.",
    )