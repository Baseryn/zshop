"""Functional test suite for the Identity domain powered by ZTestClient.

Tests customer registration, authentication, JWT tokens, profile endpoints,
and RBAC permissions using direct ZTestClient context blocks.
"""

import uuid

import pytest
from main import app
from zcore import now
from zcore.testing import ZTestClient


@pytest.mark.asyncio
async def test_register_customer_lifecycle() -> None:
    """Verify customer registration persists credentials and returns sanitized payloads."""
    unique_suffix = uuid.uuid4().hex[:6]
    registration_payload = {
        "email": f"customer_{unique_suffix}@example.com",
        "username": f"user_{unique_suffix}",
        "password": "SecurePassword123!",
        "first_name": "John",
        "last_name": "Doe",
    }
    async with ZTestClient(app) as client:
        response = await client.post("/auth/register", json=registration_payload)
        assert response.status_code == 201
        body = response.json()
        assert body["success"] is True
        assert body["data"]["email"] == registration_payload["email"]
        assert "password" not in body["data"]
        assert "password_hash" not in body["data"]


@pytest.mark.asyncio
async def test_register_duplicate_credentials_conflict() -> None:
    """Verify attempting to register identical usernames or emails triggers Conflict (409)."""
    unique_suffix = uuid.uuid4().hex[:6]
    payload = {
        "email": f"conflict_{unique_suffix}@example.com",
        "username": f"conflict_{unique_suffix}",
        "password": "Password123!",
        "first_name": "Test",
    }
    async with ZTestClient(app) as client:
        initial_resp = await client.post("/auth/register", json=payload)
        assert initial_resp.status_code == 201

        duplicate_resp = await client.post("/auth/register", json=payload)
        assert duplicate_resp.status_code == 409


@pytest.mark.asyncio
async def test_login_authentication_and_jwt_generation() -> None:
    """Verify valid credentials issue OAuth2 Bearer access tokens with user projections."""
    unique_suffix = uuid.uuid4().hex[:6]
    register_payload = {
        "email": f"auth_{unique_suffix}@example.com",
        "username": f"auth_{unique_suffix}",
        "password": "Password123!",
        "first_name": "Auth",
    }
    async with ZTestClient(app) as client:
        await client.post("/auth/register", json=register_payload)

        login_payload = {
            "login": register_payload["email"],
            "password": "Password123!",
        }
        response = await client.post("/auth/login", json=login_payload)
        assert response.status_code == 200
        token_envelope = response.json()["data"]
        assert "access_token" in token_envelope
        assert token_envelope["token_type"] == "bearer"
        assert token_envelope["user"]["email"] == register_payload["email"]


@pytest.mark.asyncio
async def test_login_invalid_password_rejection() -> None:
    """Verify invalid password inputs fail authentication with 401 Unauthorized status."""
    login_payload = {
        "login": "nonexistent@example.com",
        "password": "IncorrectPassword!",
    }
    async with ZTestClient(app) as client:
        response = await client.post("/auth/login", json=login_payload)
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_profile_endpoint() -> None:
    """Verify the /auth/me endpoint returns the authenticated context user details."""
    uid = uuid.uuid4()
    profile_attrs = {
        "email": "profile_user@test.io",
        "username": "profile_user",
        "first_name": "Profile",
        "last_name": "User",
        "is_staff": False,
        "created_at": now(),
    }
    async with ZTestClient(
        app,
        user_id=uid,
        scopes=["orders:create"],
        extra_user_attrs=profile_attrs,
    ) as client:
        response = await client.get("/auth/me")
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert body["data"]["email"] == profile_attrs["email"]
        assert "orders:create" in body["data"]["scopes"]


@pytest.mark.asyncio
async def test_customer_cannot_create_roles() -> None:
    """Verify unprivileged customer role cannot create system roles."""
    role_payload = {
        "name": f"ForbiddenRole_{uuid.uuid4().hex[:6]}",
        "scopes": ["orders:view"],
        "description": "Unauthorized role attempt",
    }
    async with ZTestClient(
        app, user_id=uuid.uuid4(), scopes=["orders:view"]
    ) as client:
        denied_response = await client.post("/identity/roles/", json=role_payload)
        assert denied_response.status_code == 403


@pytest.mark.asyncio
async def test_superadmin_can_create_roles() -> None:
    """Verify superadmin account can successfully create roles."""
    role_payload = {
        "name": f"AdminRole_{uuid.uuid4().hex[:6]}",
        "scopes": ["orders:view", "orders:update"],
        "description": "Authorized role creation",
    }
    async with ZTestClient(
        app, user_id=uuid.uuid4(), is_superuser=True
    ) as client:
        authorized_response = await client.post(
            "/identity/roles/", json=role_payload
        )
        assert authorized_response.status_code == 201
        assert authorized_response.json()["data"]["name"] == role_payload["name"]