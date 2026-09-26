"""Functional test suite for the Identity domain powered by ZCore Testing Engine.

Validates authentication workflows, password hashing lifecycles, profile endpoints,
and RBAC permissions using ZTestClient sandboxed scopes.
"""

import uuid

import httpx
import pytest


@pytest.mark.asyncio
async def test_register_customer_lifecycle(anonymous_client: httpx.AsyncClient) -> None:
    """Verify customer registration persists credentials and returns sanitized payloads."""
    unique_suffix = uuid.uuid4().hex[:6]
    registration_payload = {
        "email": f"customer_{unique_suffix}@example.com",
        "username": f"user_{unique_suffix}",
        "password": "SecurePassword123!",
        "first_name": "John",
        "last_name": "Doe",
    }
    response = await anonymous_client.post("/auth/register", json=registration_payload)
    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["email"] == registration_payload["email"]
    assert "password" not in body["data"]
    assert "password_hash" not in body["data"]


@pytest.mark.asyncio
async def test_register_duplicate_credentials_conflict(
    anonymous_client: httpx.AsyncClient,
) -> None:
    """Verify attempting to register identical usernames or emails triggers Conflict (409)."""
    unique_suffix = uuid.uuid4().hex[:6]
    payload = {
        "email": f"conflict_{unique_suffix}@example.com",
        "username": f"conflict_{unique_suffix}",
        "password": "Password123!",
        "first_name": "Test",
    }
    initial_resp = await anonymous_client.post("/auth/register", json=payload)
    assert initial_resp.status_code == 201

    duplicate_resp = await anonymous_client.post("/auth/register", json=payload)
    assert duplicate_resp.status_code == 409


@pytest.mark.asyncio
async def test_login_authentication_and_jwt_generation(
    anonymous_client: httpx.AsyncClient,
) -> None:
    """Verify valid credentials issue OAuth2 Bearer access tokens with user projections."""
    unique_suffix = uuid.uuid4().hex[:6]
    register_payload = {
        "email": f"auth_{unique_suffix}@example.com",
        "username": f"auth_{unique_suffix}",
        "password": "Password123!",
        "first_name": "Auth",
    }
    await anonymous_client.post("/auth/register", json=register_payload)

    login_payload = {
        "login": register_payload["email"],
        "password": "Password123!",
    }
    response = await anonymous_client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    token_envelope = response.json()["data"]
    assert "access_token" in token_envelope
    assert token_envelope["token_type"] == "bearer"
    assert token_envelope["user"]["email"] == register_payload["email"]


@pytest.mark.asyncio
async def test_login_invalid_password_rejection(
    anonymous_client: httpx.AsyncClient,
) -> None:
    """Verify invalid password inputs fail authentication with 401 Unauthorized status."""
    login_payload = {
        "login": "nonexistent@example.com",
        "password": "IncorrectPassword!",
    }
    response = await anonymous_client.post("/auth/login", json=login_payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_profile_endpoint(customer_client: httpx.AsyncClient) -> None:
    """Verify the /auth/me endpoint returns the authenticated context user details."""
    response = await customer_client.get("/auth/me")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "id" in body["data"]
    assert "orders:create" in body["data"]["scopes"]


@pytest.mark.asyncio
async def test_customer_cannot_create_roles(customer_client: httpx.AsyncClient) -> None:
    """Verify unprivileged customer role cannot create system roles."""
    role_payload = {
        "name": f"ForbiddenRole_{uuid.uuid4().hex[:6]}",
        "scopes": ["orders:view"],
        "description": "Unauthorized role attempt",
    }
    denied_response = await customer_client.post("/identity/roles/", json=role_payload)
    assert denied_response.status_code == 403


@pytest.mark.asyncio
async def test_superadmin_can_create_roles(superadmin_client: httpx.AsyncClient) -> None:
    """Verify superadmin account can successfully create roles."""
    role_payload = {
        "name": f"AdminRole_{uuid.uuid4().hex[:6]}",
        "scopes": ["orders:view", "orders:update"],
        "description": "Authorized role creation",
    }
    authorized_response = await superadmin_client.post(
        "/identity/roles/", json=role_payload
    )
    assert authorized_response.status_code == 201
    assert authorized_response.json()["data"]["name"] == role_payload["name"]