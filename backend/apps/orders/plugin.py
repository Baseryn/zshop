"""Orders Domain Plugin.

Integrates routes and binds the OrderNotificationListener directly
into the central EventDispatcher via IoC container reflection.
"""

from typing import ClassVar

from fastapi import FastAPI
from zcore import Plugin, container

from .routers import order_router_instance
from .services import OrderNotificationListener


class OrdersPlugin(Plugin):
    """Plugin coordinating the Orders domain."""

    name: str = "orders"
    version: str = "0.1.0"
    dependencies: ClassVar[list[str]] = ["identity", "catalog"]  # Depends on both identity and catalog

    def setup(self, app: FastAPI) -> None:
        """Mount order routers and dynamically register event listeners."""
        app.include_router(order_router_instance.router, prefix="/checkout")

        # Resolve EventDispatcher and dynamically wire methods marked with @on_event
        from zcore.kernel.events import EventDispatcher

        dispatcher = container.resolve(EventDispatcher)
        dispatcher.register_listeners(OrderNotificationListener, container)

    async def before_startup(self) -> None:
        pass

    async def on_startup(self) -> None:
        pass

    async def after_startup(self) -> None:
        pass

    async def on_shutdown(self) -> None:
        pass