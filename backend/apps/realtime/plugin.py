"""Realtime Plugin registering StreamManager and EventDispatcher listeners."""

from typing import ClassVar

from fastapi import FastAPI
from zcore import Plugin, container, settings
from zcore.web import StreamManager
from zcore.web.streams import init_stream_redis

from .routers import realtime_router
from .services import RealtimeNotificationService


class RealtimePlugin(Plugin):
    """Plugin orchestrating real-time SSE streaming and domain notification listeners."""

    name: str = "realtime"
    version: str = "0.1.0"
    dependencies: ClassVar[list[str]] = ["identity"]  # Only depends on identity for auth contracts

    def setup(self, app: FastAPI) -> None:
        """Register StreamManager singleton, mount router, and wire event listeners."""
        # 1. Register StreamManager singleton into IoC container
        stream_mgr = StreamManager()
        container.register_singleton(StreamManager, stream_mgr)

        # 2. Mount real-time endpoints
        app.include_router(realtime_router)

        # 3. Register @on_event subscribers with global EventDispatcher
        from zcore.kernel.events import EventDispatcher

        dispatcher = container.resolve(EventDispatcher)
        dispatcher.register_listeners(RealtimeNotificationService, container)

    async def before_startup(self) -> None:
        pass

    async def on_startup(self) -> None:
        """Optional: Initialize Redis client for cluster-wide PubSub if configured."""
        redis_url = getattr(settings, "REDIS_URL", None)
        if redis_url:
            try:
                import redis.asyncio as aioredis

                redis_client = aioredis.from_url(redis_url, decode_responses=True)
                init_stream_redis(redis_client)
            except Exception:
                pass

    async def after_startup(self) -> None:
        pass

    async def on_shutdown(self) -> None:
        pass