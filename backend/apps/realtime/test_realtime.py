"""Functional test suite for the Realtime domain powered by ZTestClient.

Tests persistent Server-Sent Events (SSE) connections, broadcast authorization,
and decoupled EventDispatcher pub/sub notifications.
"""

import uuid

import pytest
from zcore.testing import ZTestClient

from main import app


@pytest.mark.asyncio
async def test_broadcast_announcement_scope_authorization() -> None:
    """Verify broadcasts are restricted to users holding 'notifications:broadcast' scope."""
    payload = {
        "title": "Platform Alert",
        "message": "Routine server maintenance scheduled.",
    }

    async with ZTestClient(
        app, user_id=uuid.uuid4(), scopes=["orders:view"]
    ) as unprivileged:
        denied_response = await unprivileged.post(
            "/realtime/broadcast", json=payload
        )
        assert denied_response.status_code == 403

    async with ZTestClient(
        app, user_id=uuid.uuid4(), scopes=["notifications:broadcast"]
    ) as privileged:
        authorized_response = await privileged.post(
            "/realtime/broadcast", json=payload
        )
        assert authorized_response.status_code == 200
        assert authorized_response.json()["success"] is True


@pytest.mark.asyncio
async def test_sse_stream_initial_handshake_and_ping() -> None:
    """Verify connecting to the SSE stream yields initial ping event and unauthenticated requests are rejected."""
    async with ZTestClient(app) as client:
        unauthorized = await client.get("/realtime/stream")
        assert unauthorized.status_code == 401

    subscriber_id = uuid.uuid4()
    from zcore import container

    from apps.realtime.services import RealtimeNotificationService

    service = container.resolve(RealtimeNotificationService)
    generator = service.stream_user_events(user_id=subscriber_id)

    initial_frame = await anext(generator)
    assert "event: ping" in initial_frame
    assert "connected" in initial_frame

    await generator.aclose()