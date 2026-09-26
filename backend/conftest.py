"""Pytest root configuration utilizing 100% ZCore Native Testing Infrastructure.

Orchestrates test database initialization via setup_test_database and exposes
sandboxed asynchronous clients wrapping ZTestClient for all architectural tiers.
"""

import sys
import uuid
from collections.abc import AsyncGenerator, Callable
from pathlib import Path

import httpx
import pytest
import pytest_asyncio

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app
from zcore import now
from zcore.testing import ZTestClient, setup_test_database

from apps.identity.auth import auth_backend


@pytest.fixture(scope="session", autouse=True)
def configure_test_environment() -> None:
    """Initialize test database schemas using ZCore's native schema setup harness."""
    setup_test_database()


@pytest_asyncio.fixture
async def anonymous_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Provide a sandboxed HTTP client simulating unauthenticated public requests."""
    async with ZTestClient(app=app, user_id=None, use_db=True) as client:
        yield client


@pytest_asyncio.fixture
async def superadmin_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Provide a sandboxed HTTP client simulating platform owners bypassing RBAC."""
    admin_id = uuid.uuid4()
    admin_attrs = {
        "email": "admin@test.io",
        "username": "superadmin",
        "first_name": "Super",
        "last_name": "Admin",
        "is_staff": True,
        "created_at": now(),
    }
    async with ZTestClient(
        app=app,
        user_id=admin_id,
        is_superuser=True,
        user_dependency=auth_backend,
        extra_user_attrs=admin_attrs,
        use_db=True,
    ) as client:
        yield client


@pytest_asyncio.fixture
async def manager_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Provide a sandboxed HTTP client simulating store managers with operational scopes."""
    manager_id = uuid.uuid4()
    manager_scopes = [
        "categories:create",
        "categories:view",
        "categories:listview",
        "categories:update",
        "products:create",
        "products:view",
        "products:listview",
        "products:lookup",
        "products:update",
        "orders:view",
        "orders:listview",
        "orders:update",
        "notifications:broadcast",
    ]
    manager_attrs = {
        "email": "manager@test.io",
        "username": "manager_test",
        "first_name": "Store",
        "last_name": "Manager",
        "is_staff": True,
        "created_at": now(),
    }
    async with ZTestClient(
        app=app,
        user_id=manager_id,
        scopes=manager_scopes,
        is_superuser=False,
        user_dependency=auth_backend,
        extra_user_attrs=manager_attrs,
        use_db=True,
    ) as client:
        yield client


@pytest_asyncio.fixture
async def customer_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    """Provide a sandboxed HTTP client simulating customers with restricted field visibility."""
    customer_id = uuid.uuid4()
    customer_scopes = [
        "categories:view",
        "categories:listview",
        "products:view",
        "products:listview",
        "products:lookup",
        "orders:create",
        "orders:view",
    ]
    customer_attrs = {
        "email": "customer@test.io",
        "username": "customer_test",
        "first_name": "John",
        "last_name": "Customer",
        "is_staff": False,
        "created_at": now(),
    }
    field_restrictions = frozenset(["products.cost_price", "products.supplier_notes"])
    async with ZTestClient(
        app=app,
        user_id=customer_id,
        scopes=customer_scopes,
        is_superuser=False,
        user_dependency=auth_backend,
        extra_context={"restricted_fields": field_restrictions},
        extra_user_attrs=customer_attrs,
        use_db=True,
    ) as client:
        yield client


@pytest.fixture
def client_factory() -> Callable[..., ZTestClient]:
    """Provide a factory function to construct customized ZTestClient contexts on demand."""

    def _factory(**kwargs) -> ZTestClient:
        return ZTestClient(
            app=app, use_db=True, user_dependency=auth_backend, **kwargs
        )

    return _factory