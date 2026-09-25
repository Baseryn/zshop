from sqlalchemy.ext.asyncio import AsyncSession
from zcore import BaseRepository

from .models import Catalog
from .schemas import CatalogCreate, CatalogUpdate

class CatalogRepository(BaseRepository[Catalog]):
    def __init__(self, db: AsyncSession):
        super().__init__(model=Catalog, db=db)
