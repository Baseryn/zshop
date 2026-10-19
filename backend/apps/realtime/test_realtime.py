"""Functional test suite for the Realtime domain powered by ZTestClient.

Tests persistent Server-Sent Events (SSE) connections, broadcast authorization,
decoupled EventDispatcher pub/sub notifications, and memory leak prevention.
"""

import uuid

import pytest
from zcore import Security, container
from zcore.exceptions import AuthError
from zcore.testing import ZTestClient

from apps.realtime.routers import resolve_stream_user_id
from apps.realtime.services import RealtimeNotificationService
from main import app


@pytest.mark.asyncio
async def test_broadcast_announcement_scope_authorization() -> None:
    """Verify broadcasts are restricted to users holding 'notifications:broadcast' scope."""
    payload = {
        "title": "Platform Alert",
        "message": "Routine server maintenance scheduled.",
    }

    async with ZTestClient(app, user_id=uuid.uuid4(), scopes=["orders:view"]) as unprivileged:
        denied_response = await unprivileged.post("/realtime/broadcast", json=payload)
        assert denied_response.status_code == 403

    async with ZTestClient(
        app, user_id=uuid.uuid4(), scopes=["notifications:broadcast"]
    ) as privileged:
        authorized_response = await privileged.post("/realtime/broadcast", json=payload)
        assert authorized_response.status_code == 200
        assert authorized_response.json()["success"] is True


@pytest.mark.asyncio
async def test_sse_stream_initial_handshake_and_ping() -> None:
    """Verify connecting to the SSE stream yields initial ping event and unauthenticated requests are rejected."""
    async with ZTestClient(app) as client:
        unauthorized = await client.get("/realtime/stream")
        assert unauthorized.status_code == 401

    subscriber_id = uuid.uuid4()
    service = container.resolve(RealtimeNotificationService)
    generator = service.stream_user_events(user_id=subscriber_id)

    initial_frame = await anext(generator)
    assert "event: ping" in initial_frame
    assert "connected" in initial_frame

    await generator.aclose()


@pytest.mark.asyncio
async def test_sse_query_token_authentication() -> None:
    """Verify resolve_stream_user_id extracts identity from query token or rejects invalid token."""
    uid = uuid.uuid4()
    valid_token = Security.create_jwt(
        {"sub": str(uid), "username": "stream_user", "type": "access"}
    )

    # 1. Valid token resolution
    resolved_id = await resolve_stream_user_id(token=valid_token)
    assert resolved_id == uid

    # 2. Invalid token rejection
    with pytest.raises(AuthError):
        await resolve_stream_user_id(token="invalid_token_signature")

    # 3. Missing token rejection
    with pytest.raises(AuthError):
        await resolve_stream_user_id(token=None)


@pytest.mark.asyncio
async def test_event_dispatcher_routes_order_events_to_realtime() -> None:
    """Verify domain events (order.created & order.status_changed) push frames to the active subscriber."""
    uid = uuid.uuid4()
    service = container.resolve(RealtimeNotificationService)
    generator = service.stream_user_events(user_id=uid)
    _ = await anext(generator)

    # 1. Trigger order.created event
    test_order_id = uuid.uuid4()
    await service.handle_order_created(
        {
            "order_id": str(test_order_id),
            "user_id": str(uid),
            "total_amount": "120.00",
        }
    )
    frame_created = await anext(generator)
    assert "event: order.created" in frame_created
    assert "120.00" in frame_created

    # 2. Trigger order.status_changed event
    await service.handle_order_status_changed(
        {
            "order_id": str(test_order_id),
            "user_id": str(uid),
            "new_status": "shipped",
        }
    )
    frame_status = await anext(generator)
    assert "event: order.status_changed" in frame_status
    assert "shipped" in frame_status

    await generator.aclose()


@pytest.mark.asyncio
async def test_stream_user_isolation() -> None:
    """Verify notifications emitted to User A are not leaked to User B's stream queue."""
    user_a = uuid.uuid4()
    user_b = uuid.uuid4()
    service = container.resolve(RealtimeNotificationService)

    gen_a = service.stream_user_events(user_id=user_a)
    gen_b = service.stream_user_events(user_id=user_b)
    _ = await anext(gen_a)
    _ = await anext(gen_b)

    await service.emit_to_user(
        user_id=user_a,
        event="private.alert",
        title="Personal",
        message="Confidential alert for A only",
    )

    frame_a = await anext(gen_a)
    assert "Confidential alert for A only" in frame_a

    # User B's queue must remain empty
    queue_b = service.stream_manager.users_queues[user_b][0]
    assert queue_b.empty()

    await gen_a.aclose()
    await gen_b.aclose()


@pytest.mark.asyncio
async def test_sse_stream_cleanup_on_disconnect() -> None:
    """Verify closing an SSE stream cleanly unregisters the queue from StreamManager to prevent memory leaks."""
    uid = uuid.uuid4()
    service = container.resolve(RealtimeNotificationService)
    assert uid not in service.stream_manager.users_queues

    generator = service.stream_user_events(user_id=uid)
    _ = await anext(generator)
    assert uid in service.stream_manager.users_queues

    await generator.aclose()
    assert uid not in service.stream_manager.users_queues
