import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from zcore import Zchema


# --- Roles ---
class RoleBase(Zchema):
    __model__ = "roles"
    name: str = Field(max_length=100)
    scopes: list[str] = Field(default_factory=list)
    restricted_fields: list[str] = Field(default_factory=list)
    description: str | None = Field(default=None, max_length=255)
    is_active: bool = True

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    scopes: list[str] | None = None
    restricted_fields: list[str] | None = None
    description: str | None = None
    is_active: bool | None = None

class RoleResponse(RoleBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


# --- Users ---
class UserBase(Zchema):
    __model__ = "users"
    email: EmailStr
    username: str = Field(max_length=50)
    first_name: str = Field(max_length=50)
    last_name: str | None = Field(default=None, max_length=75)
    avatar_url: str | None = None
    is_active: bool = True
    is_verify: bool = False

class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)
    role_ids: list[uuid.UUID] = Field(default_factory=list)

class UserUpdate(BaseModel):
    email: EmailStr | None = None
    first_name: str | None = Field(default=None, max_length=50)
    last_name: str | None = Field(default=None, max_length=75)
    avatar_url: str | None = None
    is_active: bool | None = None

class UserResponse(UserBase):
    id: uuid.UUID
    is_superuser: bool
    is_staff: bool
    all_scopes: list[str] = Field(default_factory=list)
    all_restricted_fields: list[str] = Field(default_factory=list)
    last_login: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Auth & Profile Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(max_length=50)
    password: str = Field(min_length=6, max_length=128)
    first_name: str = Field(max_length=50)
    last_name: str | None = Field(default=None, max_length=75)

class UserLogin(BaseModel):
    login: str = Field(description="Username or Email")
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse