from typing import Any
from zcore import BaseRouter, RouteKey

from .models import Catalog
from .schemas import CatalogCreate, CatalogResponse, CatalogUpdate
from .services import CatalogService

class CatalogRouter(BaseRouter):
    model = Catalog
    create_schema = CatalogCreate
    update_schema = CatalogUpdate
    schema_out = CatalogResponse
    service = CatalogService
    
    prefix = "/catalog"
    tags = ["Catalog"]

    def get_route_dependencies(self, route_key: RouteKey, action: str) -> list[Any]:
        return super().get_route_dependencies(route_key, action)

router_instance = CatalogRouter()
