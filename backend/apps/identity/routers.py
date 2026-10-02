"""API Route definitions for the Identity module.

Exposes custom endpoints for authentication (register, login, me) alongside
scaffolded BaseRouter endpoints with pagination and automatic HasScopes protection.
"""

from typing import ClassVar

from fastapi import APIRouter, status
from zcore import BaseRouter, Inject, PageNumberPagination, ResponseWrapper

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

# Dedicated Router for Auth operations
auth_router = APIRouter(prefix="/auth", tags=["Auth"])


@auth_router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=ResponseWrapper[UserResponse],
)
async def register(data_in: UserRegister, service: Inject[UserService]):
    """Register a new customer account."""
    user = await service.register(data_in)
    return ResponseWrapper(data=user, message="User registered successfully.")


@auth_router.post("/login", response_model=ResponseWrapper[TokenResponse])
async def login(credentials: UserLogin, service: Inject[UserService]):
    """Authenticate with credentials and obtain an access token."""
    user, token = await service.authenticate(credentials)
    return ResponseWrapper(
        data=TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        ),
        message="Login successful.",
    )


@auth_router.get("/me", response_model=ResponseWrapper[UserResponse])
async def get_me(current_user: CurrentUser):
    """Retrieve the currently authenticated user's profile and active scopes."""
    return ResponseWrapper(data=current_user)


# =========================================================================
# Scaffolded Base Routers (Automatic CRUD, Search, Lookup, and Scope Checks)
# =========================================================================

class UserRouter(BaseRouter[UserCreate, UserUpdate]):
    """Scaffolded CRUD router for User management.
    
    Protected automatically by HasScopes against actions: users:view, users:create, etc.
    """
    model = Users
    create_schema = UserCreate
    update_schema = UserUpdate
    schema_out = UserResponse
    service = UserService
    pagination_class = PageNumberPagination
    prefix = "/users"
    tags: ClassVar = ["Users"]


class RoleRouter(BaseRouter[RoleCreate, RoleUpdate]):
    """Scaffolded CRUD router for Role management."""
    model = Roles
    create_schema = RoleCreate
    update_schema = RoleUpdate
    schema_out = RoleResponse
    service = RoleService
    pagination_class = PageNumberPagination
    prefix = "/roles"
    tags: ClassVar = ["Roles"]


user_router_instance = UserRouter()
role_router_instance = RoleRouter()