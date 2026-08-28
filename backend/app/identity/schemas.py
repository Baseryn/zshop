from zcore import Zchema
from pydantic import ConfigDict
import uuid

class IdentityBase(Zchema):
    __model__ = "identity"
    # TODO: Add your shared model attributes
    pass

class IdentityCreate(IdentityBase):
    pass

class IdentityUpdate(IdentityBase):
    pass

class IdentityResponse(IdentityBase):
    id: uuid.UUID
    
    model_config = ConfigDict(from_attributes=True)
