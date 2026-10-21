"""Catalog API Routers.

Demonstrates BaseRouter with Keyset Cursor Pagination, custom Public Read permissions,
dynamic schema pruning exposure (?schema=true), and secure binary uploads.
"""

import uuid
from typing import Any, ClassVar

from fastapi import Depends, File, UploadFile, status
from zcore import (
    BaseRouter,
    CursorPagination,
    Inject,
    PageNumberPagination,
    ResponseWrapper,
    RouteKey,
    get_optional_user_stub,
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
    lookup_schema = CategoryResponse
    service = CategoryService
    pagination_class = PageNumberPagination
    prefix = "/categories"
    tags: ClassVar = ["Categories"]

    def get_route_dependencies(self, route_key: RouteKey, action: str) -> list[Any]:
        """Make category browsing public; restrict mutations to RBAC."""
        if route_key in (RouteKey.GET, RouteKey.GET_ALL, RouteKey.SEARCH, RouteKey.LOOKUP):
            return [Depends(get_optional_user_stub)]
        return super().get_route_dependencies(route_key, action)


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

    def get_route_dependencies(self, route_key: RouteKey, action: str) -> list[Any]:
        """Allow public access for browsing and listview; mutations require RBAC."""
        if route_key in (RouteKey.GET, RouteKey.GET_ALL, RouteKey.SEARCH, RouteKey.LOOKUP):
            return [Depends(get_optional_user_stub)]
        return super().get_route_dependencies(route_key, action)

    def register_custom_routes(self) -> None:
        """Register custom non-standard CRUD endpoints."""
        self.router.add_api_route(
            path="/{id}/image",
            endpoint=self.upload_product_image,
            methods=[RouteKey.POST],
            status_code=status.HTTP_200_OK,
            response_model=ResponseWrapper[ProductResponse],
            summary="Upload Product Cover Image",
        )

    @staticmethod
    async def upload_product_image(
        id: uuid.UUID,
        service: Inject[ProductService],
        file: UploadFile = File(...),
    ) -> ResponseWrapper:
        """Upload product image passing through Magic-Bytes inspection and file validation."""
        updated_product = await service.upload_product_image(product_id=id, file=file)
        return ResponseWrapper(
            data=updated_product,
            message="Product image uploaded successfully.",
        )


category_router_instance = CategoryRouter()
product_router_instance = ProductRouter()
