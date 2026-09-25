"""Domain business services for the Identity module.

Coordinates transactional authentication, role assignments, and leverages ZCore's
WriteServiceMixin lifecycle hooks (such as pre_create) for clean password hashing.
"""

from typing import Any

from pydantic import BaseModel
from sqlalchemy import or_
from zcore import BaseService, Security, now
from zcore.exceptions import AuthError, DuplicateEntity

from .models import Roles, Users
from .repositories import RoleRepository, UserRepository
from .schemas import UserCreate, UserLogin, UserRegister, UserUpdate


class UserService(BaseService[Users]):
    """Business service handling user lifecycle, authentication, and password hashing."""

    def __init__(self, repository: UserRepository, role_repository: RoleRepository):
        super().__init__(model=Users, repository=repository)
        self.role_repository = role_repository

    async def pre_create(self, schema: BaseModel) -> dict[str, Any] | None:
        """Lifecycle hook executed prior to database insertion.
        
        Extracts the plaintext password, securely hashes it using Argon2id,
        and provides it as 'password_hash' to the model.
        """
        if isinstance(schema, (UserCreate, UserRegister)):
            hashed = Security.hash_password(schema.password)
            return {"password_hash": hashed}
        return None

    async def pre_update(
        self, target: Users | Any, schema: BaseModel, partial: bool
    ) -> dict[str, Any] | None:
        """Lifecycle hook executed prior to updating a record.
        
        Hashes password if an updated password is provided in UserUpdate.
        """
        if isinstance(schema, UserUpdate) and schema.password:
            hashed = Security.hash_password(schema.password)
            return {"password_hash": hashed}
        return None

    async def register(self, schema: UserRegister) -> Users:
        """Register a new customer account, ensuring uniqueness of username and email."""
        exists = await self.repository.exist(
            or_(
                self.model.email == schema.email,
                self.model.username == schema.username,
            )
        )
        if exists:
            raise DuplicateEntity(message="Email or username already registered.")

        # Create record; pre_create lifecycle hook automatically computes password_hash
        return await self.create(schema)

    async def authenticate(self, credentials: UserLogin) -> tuple[Users, str]:
        """Verify user credentials and generate a signed JWT access token."""
        user = await self.repository.get(
            or_(
                self.model.email == credentials.login,
                self.model.username == credentials.login,
            )
        )

        if not user or not Security.verify_password(credentials.password, user.password_hash):
            raise AuthError(message="Invalid username/email or password.")

        if not user.is_active:
            raise AuthError(message="Account is disabled.")

        # Update last_login timestamp using ZCore's timezone-aware now()
        user.last_login = now()
        await self._safe_commit()

        # Build token payload and encode via ZCore's Security subsystem
        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "type": "access",
        }
        token = Security.create_jwt(token_data)
        return user, token

    async def assign_roles(self, user_id: Any, role_ids: list[Any]) -> Users:
        """Assign a set of roles to a target user."""
        user = await self.get(id=user_id)
        roles = await self.role_repository.get_by_ids(ids=role_ids)
        user.roles = list(roles)
        await self._safe_commit()
        return user


class RoleService(BaseService[Roles]):
    """Business service orchestrating RBAC roles."""

    def __init__(self, repository: RoleRepository):
        super().__init__(model=Roles, repository=repository)