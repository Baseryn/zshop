import uuid
from typing import Annotated

from fastapi import Depends
from zcore import BaseAuth, container

from .models import Users
from .schemas import UserResponse
from .services import UserService


class JWTAuth(BaseAuth[UserResponse]):
    def __init__(self) -> None:
        super().__init__(
            user_schema=UserResponse,
            identity_claim="sub",
            token_type="access",
            cache_prefix="auth:users",
            cache_ttl=300,  # 5 minutes cache
        )

    async def fetch_user(self, identity: str) -> Users | None:
        try:
            user_id = uuid.UUID(identity)
        except (ValueError, TypeError):
            return None
        user_service = container.resolve(UserService)
        return await user_service.repository.get(id=user_id)

auth_backend = JWTAuth()

CurrentUser = Annotated[UserResponse, Depends(auth_backend)]