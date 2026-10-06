"""Catalog Plugin module adhering to ZCore's Plugin Protocol."""

from typing import ClassVar

from fastapi import FastAPI
from zcore import Plugin, StorageProvider, container
from zcore.storage import LocalStorageProvider

from contracts.catalog import ProductContract

from .routers import category_router_instance, product_router_instance
from .services import ProductService


class CatalogPlugin(Plugin):
    """Plugin registering catalog services and routes."""

    name: str = "catalog"
    version: str = "0.1.0"
    dependencies: ClassVar[list[str]] = ["identity"]  # Depends on identity for RBAC context

    def setup(self, app: FastAPI) -> None:
        """Register the storage provider and mount domain routers."""

        container.register_scoped(ProductContract, ProductService)

        # Ensure a singleton StorageProvider is available in the IoC Container
        container.register_singleton(
            StorageProvider,
            LocalStorageProvider(base_path="./storage", url_prefix="/storage"),
        )

        app.include_router(category_router_instance.router, prefix="/catalog")
        app.include_router(product_router_instance.router, prefix="/catalog")

    async def before_startup(self) -> None:
        pass

    async def on_startup(self) -> None:
        pass

    async def after_startup(self) -> None:
        pass

    async def on_shutdown(self) -> None:
        pass