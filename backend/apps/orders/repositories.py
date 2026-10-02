"""Data repositories for the Orders module."""

from sqlalchemy.ext.asyncio import AsyncSession
from zcore import BaseRepository

from .models import OrderItems, Orders


class OrderRepository(BaseRepository[Orders]):
    """Data persistence repository for the Orders aggregate root."""

    def __init__(self, db: AsyncSession):
        super().__init__(model=Orders, db=db)
        self.cursor_field = "created_at"


class OrderItemRepository(BaseRepository[OrderItems]):
    """Data persistence repository for individual order line items."""

    def __init__(self, db: AsyncSession):
        super().__init__(model=OrderItems, db=db)