from datetime import UTC, datetime

from sqlalchemy import or_
from zcore import BaseService, Security
from zcore.exceptions import AuthError, DuplicateEntity

from .models import Roles, Users
from .repositories import RoleRepository, UserRepository
from .schemas import UserLogin, UserRegister


class UserService(BaseService[Users]):
    def __init__(self, repository: UserRepository):
        super().__init__(model=Users, repository=repository)

    async def register(self, schema: UserRegister) -> Users:
        if await self.repository.exist(or_(
            self.model.email==schema.email,
            self.model.username==schema.username
        )):
            raise DuplicateEntity(message="Email or username already registered.")

        hashed_pwd = Security.hash_password(schema.password_hash)
        data = schema.model_dump()
        data["password_hash"] = hashed_pwd
        
        return await self.create(schema, password_hash=hashed_pwd)

    async def authenticate(self, credentials: UserLogin) -> tuple[Users, str]:
        user = await self.repository.get(
            or_(
                self.model.email==credentials.login,
                self.model.username==credentials.login
                )
            )

        if not user or not Security.verify_password(credentials.password_hash, user.password_hash):
            raise AuthError(message="Invalid credentials.")

        if not user.is_active:
            raise AuthError(message="Account is disabled.")

        # Update last login
        user.last_login = datetime.now(UTC)
        await self._safe_commit()

        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "type": "access",
        }
        token = Security.create_jwt(token_data)
        return user, token

class RoleService(BaseService[Roles]):
    def __init__(self, repository: RoleRepository):
        super().__init__(model=Roles, repository=repository)
