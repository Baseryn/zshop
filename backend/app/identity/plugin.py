from fastapi import FastAPI
from zcore import Plugin

class IdentityPlugin(Plugin):
    name = "identity"
    version = "0.1.0"
    dependencies = []  # Add dependent plugin names here (e.g. ['security_plugin'])

    def setup(self, app: FastAPI) -> None:
        # Wire this module's sub-router directly to the central FastAPI app
        
        # from .routers import router_instance
        # app.include_router(router_instance.router)
        pass

    async def before_startup(self) -> None:
        # Executes before any other plugin starts
        pass

    async def on_startup(self) -> None:
        # Standard startup logic (e.g. warming up local caches)
        pass

    async def after_startup(self) -> None:
        # Post-startup cleanups
        pass

    async def on_shutdown(self) -> None:
        # Cleanup tasks for this specific module
        pass
