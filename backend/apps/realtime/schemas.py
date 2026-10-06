"""Data Transfer Objects for the Realtime and Notifications domain."""

import uuid
from typing import Any

from pydantic import BaseModel, Field
from zcore import ZDateTime, now


class NotificationPayload(BaseModel):
    """Event envelope pushed through SSE streams to connected clients."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    event: str = Field(description="Event name identifier, e.g. 'order.status_changed'")
    title: str = Field(description="Human-readable notification title")
    message: str = Field(description="Descriptive message content")
    data: dict[str, Any] = Field(default_factory=dict, description="Contextual payload")
    timestamp: ZDateTime = Field(default_factory=now)


class BroadcastRequest(BaseModel):
    """Administrative schema to broadcast system-wide alerts to users."""

    title: str = Field(min_length=3, max_length=150)
    message: str = Field(min_length=5, max_length=1000)
    target_user_ids: list[uuid.UUID] | None = Field(
        default=None,
        description="Optional list of recipients; if None, targets active listeners",
    )