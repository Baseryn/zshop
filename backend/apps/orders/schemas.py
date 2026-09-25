import uuid
from pydantic import ConfigDict
from zcore import Zchema

class OrdersBase(Zchema):
    __model__ = "orders"

class OrdersCreate(OrdersBase):
    pass

class OrdersUpdate(OrdersBase):
    pass

class OrdersResponse(OrdersBase):
    id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)
