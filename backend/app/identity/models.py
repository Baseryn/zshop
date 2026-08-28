import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Table, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from zcore import Base

user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id",ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id",ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class Users(Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    ) 

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    
    first_name: Mapped[str] = mapped_column(String(50))
    last_name: Mapped[str] = mapped_column(String(75))
    
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verify: Mapped[bool] = mapped_column(Boolean, default=True)
    
    last_login: Mapped[datetime | None] = mapped_column(DateTime, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    deleted_at: Mapped[datetime] = mapped_column(DateTime)
    
    roles: Mapped[list["Roles"]] = relationship(secondary=user_roles, lazy="selectin", back_populates="users")
    
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    is_staff: Mapped[bool] = mapped_column(Boolean, default=False)

    
    @property
    def all_scopes(self) -> set[str]:
        user_scope = set()
        for role in self.roles:
            if role.is_active:
                user_scope.update(role.scopes)
        return user_scope
    
    @property
    def all_restricted_fields(self) -> set[str]:
        fields = set()
        for role in self.roles:
            if role.is_active and role.restricted_fields:
                fields.update(role.restricted_fields)
        return fields
    
class Roles(Base):
    __tablename__ = "roles"
    
    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    ) 
    
    name: Mapped[str] = mapped_column(String(100), unique=True)
    scopes: Mapped[list[str] | None] = mapped_column(ARRAY(String), default=[]) # "order:read", "order:create" , . . .
    restricted_fields: Mapped[list[str]] = mapped_column(ARRAY(String), default=[]) # "order.id", "users.view.first_name", . . .
    description: Mapped[str|None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    users: Mapped[list["Users"] | None] = relationship(secondary=user_roles, back_populates="roles")