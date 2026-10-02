"""Database repositories for the Identity module.

Leverages ZCore's generic BaseRepository with built-in asynchronous
CRUD, search, dynamic pagination, and soft-delete capabilities.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from zcore import BaseRepository

from .models import Roles, Users


class UserRepository(BaseRepository[Users]):
    """Data persistence repository for Users."""

    def __init__(self, db: AsyncSession):
        super().__init__(model=Users, db=db)


class RoleRepository(BaseRepository[Roles]):
    """Data persistence repository for Roles."""

    def __init__(self, db: AsyncSession):
        super().__init__(model=Roles, db=db)