from zcore import BaseService
from .models import Orders
from .repositories import OrdersRepository

class OrdersService(BaseService[Orders]):
    def __init__(self, repository: OrdersRepository):
        super().__init__(model=Orders, repository=repository)
