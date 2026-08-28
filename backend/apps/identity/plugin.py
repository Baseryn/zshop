from typing import ClassVar

from fastapi import FastAPI
from zcore import Plugin

from .routers import auth_router, role_router_instance, user_router_instance


class IdentityPlugin(Plugin):
    name = "identity"
    version = "0.1.0"
    dependencies: ClassVar = []

    def setup(self, app: FastAPI) -> None:
        app.include_router(auth_router)
        app.include_router(user_router_instance.router, prefix="/identity")
        app.include_router(role_router_instance.router, prefix="/identity")