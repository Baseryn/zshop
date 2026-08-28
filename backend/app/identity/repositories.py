from zcore import BaseRepository
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Identity

class IdentityRepository(BaseRepository[Identity]):
    def __init__(self, db: AsyncSession):
        super().__init__(model=Identity, db=db)
