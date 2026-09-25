from fastapi import FastAPI
from zcore import Plugin

class OrdersPlugin(Plugin):
    name = "orders"
    version = "0.1.0"
    dependencies = []

    def setup(self, app: FastAPI) -> None:
        pass

    async def before_startup(self) -> None:
        pass

    async def on_startup(self) -> None:
        pass

    async def after_startup(self) -> None:
        pass

    async def on_shutdown(self) -> None:
        pass
