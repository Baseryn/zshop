from zcore import BaseService

from .models import Roles, Users
from .repositories import RoleRepository, UserRepository


class UserService(BaseService[Users]):
    def __init__(self, repository: UserRepository):
        super().__init__(model=Users, repository=repository)

class RoleService(BaseService[Roles]):
    def __init__(self, repository: RoleRepository):
        super().__init__(model=Roles, repository=repository)
