"""Data repositories for Categories and Products."""

from sqlalchemy.ext.asyncio import AsyncSession
from zcore import BaseRepository

from .models import Categories, Products


class CategoryRepository(BaseRepository[Categories]):
    """Data persistence repository for Categories."""

    def __init__(self, db: AsyncSession):
        super().__init__(model=Categories, db=db)


class ProductRepository(BaseRepository[Products]):
    """Data persistence repository for Products.
    
    Configures cursor_field for high-performance keyset pagination.
    """

    def __init__(self, db: AsyncSession):
        super().__init__(model=Products, db=db)
        self.cursor_field = "created_at"  # Sort and paginate by creation timestamp