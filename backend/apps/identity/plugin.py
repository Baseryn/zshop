"""Identity Domain Plugin.

Implements ZCore's Plugin lifecycle protocol, mounting routers and linking
the authentication backend to the global get_current_user_stub dependency.
"""

from typing import ClassVar

from fastapi import FastAPI, Request
from zcore import Plugin, Security
from zcore.context.context import ctx
from zcore.security.dependencies import get_current_user_stub

from .auth import auth_backend
from .routers import auth_router, role_router_instance, user_router_instance
from .schemas import UserResponse


class IdentityPlugin(Plugin):
    """ZCore Plugin encapsulating the Identity and RBAC architectural domain."""

    name: str = "identity"
    version: str = "0.1.0"
    dependencies: ClassVar[list[str]] = []

    def setup(self, app: FastAPI) -> None:
        """Register routes and configure global security dependency overrides."""
        # 1. Middleware to hydrate user context if Authorization header exists, or set guest restrictions
        @app.middleware("http")
        async def hydrate_auth_context_middleware(request: Request, call_next):
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header[7:].strip()
                try:
                    payload = Security.decode_jwt(token)
                    identity = payload.get("sub")
                    if identity:
                        user = await auth_backend.fetch_user(identity)
                        if user and getattr(user, "is_active", True):
                            user_data = UserResponse.model_validate(user)
                            ctx.user_id = user_data.id
                            ctx.restricted_fields = frozenset(user_data.all_restricted_fields)
                            ctx.set("scopes", set(user_data.scopes))
                            ctx.set("is_staff", user_data.is_staff)
                            ctx.set("is_superuser", user_data.is_superuser)
                            return await call_next(request)
                except Exception:
                    pass

            if not ctx.user_id:
                ctx.restricted_fields = frozenset(["products.cost_price", "products.supplier_notes"])

            return await call_next(request)

        # 2. Register auth backend into the framework's dependency stub
        app.dependency_overrides[get_current_user_stub] = auth_backend

        # 3. Mount domain routers
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