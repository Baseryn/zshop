"""API Routers exposing Server-Sent Events (SSE) and broadcast endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from zcore import HasScopes, Inject, ResponseWrapper, Security
from zcore.context.context import ctx
from zcore.exceptions import AuthError

from .schemas import BroadcastRequest
from .services import RealtimeNotificationService

realtime_router = APIRouter(prefix="/realtime", tags=["Realtime"])


async def resolve_stream_user_id(
    token: str | None = Query(default=None, description="Optional bearer token for EventSource queries"),
) -> uuid.UUID:
    """Resolve user identity from authorization headers or EventSource query params.
    
    Standard browser EventSource APIs cannot set custom headers; this resolver
    seamlessly accommodates both Bearer headers and query token authentications.
    """
    if ctx.user_id:
        return ctx.user_id

    if token:
        try:
            payload = Security.decode_jwt(token)
            identity = payload.get("sub")
            if identity:
                return uuid.UUID(identity)
        except Exception:
            pass

    raise AuthError(message="Authentication required for real-time notification stream.")


@realtime_router.get(
    "/stream",
    summary="Connect to Server-Sent Events (SSE) Notification Stream",
    response_class=StreamingResponse,
)
async def stream_notifications(
    user_id: Annotated[uuid.UUID, Depends(resolve_stream_user_id)],
    service: Inject[RealtimeNotificationService],
):
    """Open persistent SSE connection streaming real-time order and account updates."""
    event_generator = service.stream_user_events(user_id=user_id)
    return StreamingResponse(
        event_generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disables proxy buffering for Nginx
        },
    )


@realtime_router.post(
    "/broadcast",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(HasScopes("notifications:broadcast"))],
    summary="Administrative Broadcast Announcement",
)
async def broadcast_notification(
    payload: BroadcastRequest,
    service: Inject[RealtimeNotificationService],
):
    """Broadcast notifications to specific users or all active listener queues."""
    target_ids = payload.target_user_ids or list(service.stream_manager.users_queues.keys())

    for u_id in target_ids:
        await service.emit_to_user(
            user_id=u_id,
            event="system.announcement",
            title=payload.title,
            message=payload.message,
        )

    return ResponseWrapper(
        message=f"Broadcast successfully queued for {len(target_ids)} user(s)."
    )