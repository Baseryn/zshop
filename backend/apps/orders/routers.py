from typing import Any
from zcore import BaseRouter, RouteKey

from .models import Orders
from .schemas import OrdersCreate, OrdersResponse, OrdersUpdate
from .services import OrdersService

class OrdersRouter(BaseRouter):
    model = Orders
    create_schema = OrdersCreate
    update_schema = OrdersUpdate
    schema_out = OrdersResponse
    service = OrdersService
    
    prefix = "/orders"
    tags = ["Orders"]

    def get_route_dependencies(self, route_key: RouteKey, action: str) -> list[Any]:
        return super().get_route_dependencies(route_key, action)

router_instance = OrdersRouter()
