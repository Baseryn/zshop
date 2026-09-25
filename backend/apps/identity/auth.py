"""Authentication backend and FastAPI dependency bindings.

Integrates ZCore's BaseAuth with two-tier caching (Redis + In-Memory TTLLRUCache)
and dynamically hydrates ZContext on every authenticated request.
"""

import uuid
from typing import Annotated

from fastapi import Depends
from zcore import BaseAuth, container

from .models import Users
from .schemas import UserResponse
from .services import UserService


class JWTAuth(BaseAuth[UserResponse]):
    """Custom authentication provider extending ZCore's generic BaseAuth.
    
    Verifies JWT access tokens, leverages Redis/local memory cache for user data,
    and automatically populates ctx.user_id, ctx.restricted_fields, and user scopes.
    """

    def __init__(self) -> None:
        super().__init__(
            user_schema=UserResponse,
            identity_claim="sub",
            token_type="access",
            cache_prefix="auth:users",
            cache_ttl=300,  # 5 minutes TTL
        )

    async def fetch_user(self, identity: str) -> Users | None:
        """Fetch the persistent user entity when cache misses."""
        try:
            user_id = uuid.UUID(identity)
        except (ValueError, TypeError):
            return None

        user_service = container.resolve(UserService)
        return await user_service.repository.get(id=user_id)


# Global singleton instance of the auth backend
auth_backend = JWTAuth()

# Reusable dependency annotation for securing custom route endpoints
CurrentUser = Annotated[UserResponse, Depends(auth_backend)]