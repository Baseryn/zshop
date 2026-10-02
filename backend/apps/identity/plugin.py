"""Identity Domain Plugin.

Implements ZCore's Plugin lifecycle protocol, mounting routers and linking
the authentication backend to the global get_current_user_stub dependency.
"""

from typing import ClassVar

from fastapi import FastAPI
from zcore import Plugin
from zcore.security.dependencies import get_current_user_stub

from .auth import auth_backend
from .routers import auth_router, role_router_instance, user_router_instance


class IdentityPlugin(Plugin):
    """ZCore Plugin encapsulating the Identity and RBAC architectural domain."""

    name: str = "identity"
    version: str = "0.1.0"
    dependencies: ClassVar[list[str]] = []

    def setup(self, app: FastAPI) -> None:
        """Register routes and configure global security dependency overrides."""
        # 1. Register auth backend into the framework's dependency stub
        app.dependency_overrides[get_current_user_stub] = auth_backend

        # 2. Mount domain routers
        app.include_router(auth_router)
        app.include_router(user_router_instance.router, prefix="/identity")
        app.include_router(role_router_instance.router, prefix="/identity")

    async def before_startup(self) -> None:
        """Pre-startup hooks for caching warmups or database checks."""
        pass

    async def on_startup(self) -> None:
        """Core startup execution logic."""
        pass

    async def after_startup(self) -> None:
        """Post-initialization procedures."""
        pass

    async def on_shutdown(self) -> None:
        """Clean teardown routines."""
        pass