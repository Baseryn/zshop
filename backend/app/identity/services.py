from zcore import BaseService
from .models import Identity
from .repositories import IdentityRepository

class IdentityService(BaseService[Identity]):
    def __init__(self, repository: IdentityRepository):
        super().__init__(model=Identity, repository=repository)
