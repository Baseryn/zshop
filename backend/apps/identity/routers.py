from typing import ClassVar

from fastapi import APIRouter, status
from zcore import BaseRouter, Inject, ResponseWrapper

from .auth import CurrentUser
from .models import Roles, Users
from .schemas import (
    RoleCreate,
    RoleResponse,
    RoleUpdate,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
)
from .services import RoleService, UserService

auth_router = APIRouter(prefix="/auth", tags=["Auth"])


@auth_router.post("/register", status_code=status.HTTP_201_CREATED, response_model=ResponseWrapper[UserResponse])
async def register(data_in: UserRegister, service: Inject[UserService]):
    user = await service.register(data_in)
    return ResponseWrapper(data=user, message="User registered successfully.")


@auth_router.post("/login", response_model=ResponseWrapper[TokenResponse])
async def login(credentials: UserLogin, service: Inject[UserService]):
    user, token = await service.authenticate(credentials)
    return ResponseWrapper(
        data=TokenResponse(access_token=token, user=UserResponse.model_validate(user)),
        message="Login successful."
    )


@auth_router.get("/me", response_model=ResponseWrapper[UserResponse])
async def get_me(current_user: CurrentUser):
    return ResponseWrapper(data=current_user)


# Base Routers for CRUD + Search (Protected automatically by HasScopes using get_current_user_stub)
class UserRouter(BaseRouter[UserCreate, UserUpdate]):
    model = Users
    create_schema = UserCreate
    update_schema = UserUpdate
    schema_out = UserResponse
    service = UserService
    prefix = "/users"
    tags: ClassVar = ["Users"]


class RoleRouter(BaseRouter[RoleCreate, RoleUpdate]):
    model = Roles
    create_schema = RoleCreate
    update_schema = RoleUpdate
    schema_out = RoleResponse
    service = RoleService
    prefix = "/roles"
    tags: ClassVar = ["Roles"]


user_router_instance = UserRouter()
role_router_instance = RoleRouter()