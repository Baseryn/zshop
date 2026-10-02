"""Realtime notification engine powered by ZCore's StreamManager and @on_event listeners.

Adheres strictly to Event-Driven Modular Monolith principles: listens to domain
events emitted by other modules without importing any of their internal code.
"""

import asyncio
import uuid
from collections.abc import AsyncGenerator
from typing import Any

import structlog
from zcore import json_dumps, now, on_event
from zcore.web import StreamManager

from .schemas import NotificationPayload

logger = structlog.get_logger("zshop.realtime")


class RealtimeNotificationService:
    """Service orchestrating real-time SSE delivery and domain event translation."""

    def __init__(self, stream_manager: StreamManager):
        self.stream_manager = stream_manager

    async def emit_to_user(
        self,
        user_id: uuid.UUID,
        event: str,
        title: str,
        message: str,
        data: dict[str, Any] | None = None,
    ) -> None:
        """Publish a structured event envelope directly to a user's active stream queues."""
        notification = NotificationPayload(
            event=event,
            title=title,
            message=message,
            data=data or {},
            timestamp=now(),
        )

        payload_dict = notification.model_dump(mode="json")
        await self.stream_manager.publish(user_id=user_id, data=payload_dict)
        logger.info("Dispatched real-time notification to user", user_id=str(user_id), event=event)

    async def stream_user_events(
        self,
        user_id: uuid.UUID,
    ) -> AsyncGenerator[str, None]:
        """Subscribe to user queue and format incoming events into standard SSE frames.
        
        Yields frames matching the text/event-stream specification:
        'event: <event_name>\ndata: <json_payload>\n\n'
        """
        async with self.stream_manager.subscription(user_id=user_id) as queue:
            # Yield initial connection heartbeat frame
            initial_event = json_dumps({"status": "connected", "user_id": str(user_id)})
            yield f"event: ping\ndata: {initial_event}\n\n"

            while True:
                try:
                    # Await messages from local memory queue or Redis PubSub
                    message_data = await queue.get()
                    event_name = message_data.get("event", "message")
                    formatted_data = json_dumps(message_data)
                    yield f"event: {event_name}\ndata: {formatted_data}\n\n"
                except asyncio.CancelledError:
                    break

    # =========================================================================
    # Domain Event Subscribers (Purely Decoupled Event Handling)
    # =========================================================================

    @on_event("order.created")
    async def handle_order_created(self, payload: dict[str, Any]) -> None:
        """Translate 'order.created' domain event into customer live notification."""
        try:
            user_id = uuid.UUID(payload["user_id"])
            order_id = payload["order_id"]
            total = payload.get("total_amount", "0.00")

            await self.emit_to_user(
                user_id=user_id,
                event="order.created",
                title="Order Received!",
                message=f"Your order #{order_id[:8]} for ${total} has been placed successfully.",
                data=payload,
            )
        except Exception as e:
            logger.error("Failed to route 'order.created' notification", error=str(e))

    @on_event("order.status_changed")
    async def handle_order_status_changed(self, payload: dict[str, Any]) -> None:
        """Translate 'order.status_changed' domain event into customer live notification."""
        try:
            user_id = uuid.UUID(payload["user_id"])
            order_id = payload["order_id"]
            new_status = payload.get("new_status", "updated")

            await self.emit_to_user(
                user_id=user_id,
                event="order.status_changed",
                title="Order Status Updated",
                message=f"Your order #{order_id[:8]} is now '{new_status}'.",
                data=payload,
            )
        except Exception as e:
            logger.error("Failed to route 'order.status_changed' notification", error=str(e))