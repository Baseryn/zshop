from zcore import BaseService
from .models import Catalog
from .repositories import CatalogRepository

class CatalogService(BaseService[Catalog]):
    def __init__(self, repository: CatalogRepository):
        super().__init__(model=Catalog, repository=repository)
