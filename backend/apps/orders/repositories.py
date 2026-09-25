from sqlalchemy.ext.asyncio import AsyncSession
from zcore import BaseRepository

from .models import Orders
from .schemas import OrdersCreate, OrdersUpdate

class OrdersRepository(BaseRepository[Orders]):
    def __init__(self, db: AsyncSession):
        super().__init__(model=Orders, db=db)
