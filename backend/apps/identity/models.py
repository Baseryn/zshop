"""Database models for the Identity module.

Defines Users, Roles, and their Many-to-Many association, integrating
ZCore's Base declarative and SoftDeleteMixin for audit-safe lifecycles.
"""

import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, String, Table, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from zcore import Base, SoftDeleteMixin

# Association table for User-to-Role Many-to-Many relationship
user_roles = Table(
    "user_roles",
    Base.metadata,
    Column(
        "user_id",
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "role_id",
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Roles(Base):
    """Role model for Role-Based Access Control (RBAC).

    Holds granular system scopes and field restriction rules utilized by
    ZCore's context-aware pruning engine. Uses JSON serialization to ensure
    cross-database portability across SQLite, PostgreSQL, and MySQL.
    """

    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    scopes: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
    )
    restricted_fields: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
    )
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    users: Mapped[list["Users"]] = relationship(
        secondary=user_roles,
        back_populates="roles",
        lazy="selectin",
    )


class Users(Base, SoftDeleteMixin):
    """User account entity adhering to ZCore's UserProtocol.

    Includes soft deletion, timezone-aware audit timestamps, and dynamic
    properties computing aggregate scopes and field restrictions across all active roles.
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))

    first_name: Mapped[str] = mapped_column(String(50))
    last_name: Mapped[str | None] = mapped_column(String(75), nullable=True)

    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verify: Mapped[bool] = mapped_column(Boolean, default=False)

    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    is_staff: Mapped[bool] = mapped_column(Boolean, default=False)

    last_login: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    roles: Mapped[list[Roles]] = relationship(
        secondary=user_roles,
        back_populates="users",
        lazy="selectin",
    )

    @property
    def all_scopes(self) -> set[str]:
        """Aggregate set of all active scopes granted via assigned roles."""
        user_scopes: set[str] = set()
        for role in self.roles:
            if role.is_active and role.scopes:
                user_scopes.update(role.scopes)
        return user_scopes

    @property
    def scopes(self) -> set[str]:
        """Primary property consumed by ZCore's HasScopes security checker."""
        return self.all_scopes

    @property
    def all_restricted_fields(self) -> set[str]:
        """Aggregate collection of restricted data paths enforced by ZContext."""
        restrictions: set[str] = set()
        for role in self.roles:
            if role.is_active and role.restricted_fields:
                restrictions.update(role.restricted_fields)
        return restrictions