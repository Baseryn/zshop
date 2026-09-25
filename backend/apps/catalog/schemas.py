import uuid
from pydantic import ConfigDict
from zcore import Zchema

class CatalogBase(Zchema):
    __model__ = "catalog"

class CatalogCreate(CatalogBase):
    pass

class CatalogUpdate(CatalogBase):
    pass

class CatalogResponse(CatalogBase):
    id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)
