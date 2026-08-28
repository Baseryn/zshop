from sqlalchemy.ext.asyncio import AsyncSession
from zcore import BaseRepository

from .models import Roles, Users


class UserRepository(BaseRepository[Users]):
    def __init__(self, db: AsyncSession):
        super().__init__(model=Users, db=db)

class RoleRepository(BaseRepository[Roles]):
    def __init__(self, db: AsyncSession):
        super().__init__(model=Roles, db=db)