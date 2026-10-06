"""Pydantic V2 schemas for the Identity domain.

Leverages ZCore's Zchema base class for contextual field masking and pruning.
"""

import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from zcore import Zchema, ZDateTime

# ==========================================
# Role Schemas
# ==========================================

class RoleBase(Zchema):
    """Base schema for roles, mapped to the 'roles' domain."""
    __model__ = "roles"

    name: str = Field(max_length=100)
    scopes: list[str] = Field(default_factory=list)
    restricted_fields: list[str] = Field(default_factory=list)
    description: str | None = Field(default=None, max_length=255)
    is_active: bool = True


class RoleCreate(RoleBase):
    """Payload schema for creating a new RBAC role."""
    pass


class RoleUpdate(Zchema):
    """Payload schema for updating role attributes."""
    __model__ = "roles"

    name: str | None = Field(default=None, max_length=100)
    scopes: list[str] | None = None
    restricted_fields: list[str] | None = None
    description: str | None = None
    is_active: bool | None = None


class RoleResponse(RoleBase):
    """Output presentation schema for roles."""
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# User Schemas
# ==========================================

class UserBase(Zchema):
    """Base schema for users, mapped to the 'users' domain for contextual pruning."""
    __model__ = "users"

    email: EmailStr
    username: str = Field(max_length=50)
    first_name: str = Field(max_length=50)
    last_name: str | None = Field(default=None, max_length=75)
    avatar_url: str | None = None
    is_active: bool = True
    is_verify: bool = False


class UserCreate(UserBase):
    """Payload schema for creating a user via the admin or user management router."""
    password: str = Field(min_length=6, max_length=128, exclude=True)
    role_ids: list[uuid.UUID] = Field(default_factory=list, exclude=True)


class UserUpdate(Zchema):
    """Payload schema for updating user properties."""
    __model__ = "users"

    email: EmailStr | None = None
    first_name: str | None = Field(default=None, max_length=50)
    last_name: str | None = Field(default=None, max_length=75)
    avatar_url: str | None = None
    is_active: bool | None = None
    password: str | None = Field(
        default=None, min_length=6, max_length=128, exclude=True
    )


class UserResponse(UserBase):
    """Public/Authenticated user projection schema.
    
    Includes aggregated scopes and restricted fields used by ZCore's BaseAuth.
    """
    id: uuid.UUID
    is_superuser: bool
    is_staff: bool
    scopes: list[str] = Field(default_factory=list)
    all_restricted_fields: list[str] = Field(default_factory=list)
    last_login: ZDateTime | None = None
    created_at: ZDateTime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# Authentication Schemas
# ==========================================

class UserRegister(BaseModel):
    """Registration schema accepting plaintext password excluded from direct model dumps."""

    email: EmailStr
    username: str = Field(max_length=50)
    password: str = Field(min_length=6, max_length=128, exclude=True)
    first_name: str = Field(max_length=50)
    last_name: str | None = Field(default=None, max_length=75)


class UserLogin(BaseModel):
    """Login credentials schema accepting email or username."""
    login: str = Field(description="Username or Email address")
    password: str = Field(min_length=6, max_length=128)


class TokenResponse(BaseModel):
    """Standard OAuth2-compliant Bearer token response envelope."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse