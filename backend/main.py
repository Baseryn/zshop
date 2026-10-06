"""ZShop Application Entrypoint.

Bootstraps the FastAPI application using ZCore's Kernel architecture,
registers domain plugins with automatic topological dependency resolution,
and configures request middlewares and global exception handlers.
"""

import os
import sys
from pathlib import Path

# Add backend directory to Python path for clean module resolutions
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from zcore import (
    Kernel,
    db_manager,
    register_db_event_dispatcher,
    register_exception_handlers,
    settings,
)
from zcore.logging import setup_logging
from zcore.web import RequestLogMiddleware, ScopedDependencyMiddleware

# Import Domain Plugins
from apps.catalog.plugin import CatalogPlugin
from apps.identity.plugin import IdentityPlugin
from apps.orders.plugin import OrdersPlugin
from apps.realtime.plugin import RealtimePlugin

# 1. Initialize Structured Logging (Console + File Support)
setup_logging()

# 2. Configure Database Pool and Session Factory
db_manager.init_app(config=settings.DATABASE)

# 3. Instantiate ZCore Kernel and bind Event Dispatcher to Database Events
kernel = Kernel()
register_db_event_dispatcher(kernel.dispatcher)

# 4. Register Domain Plugins into the Kernel
# The Kernel automatically performs topological sorting based on declared dependencies:
# (identity -> catalog -> orders, identity -> realtime)
kernel.add_plugin(IdentityPlugin())
kernel.add_plugin(CatalogPlugin())
kernel.add_plugin(OrdersPlugin())
kernel.add_plugin(RealtimePlugin())

# 5. Create FastAPI Application with Kernel Lifespan Context
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="High-Performance Modular Monolith Showcase built with FastAPI ZCore Framework.",
    version="0.1.0-rc.2",
    lifespan=kernel.lifespan,
)

# 6. Setup Plugins and Register Core IoC Singletons
kernel.setup(app)

# 7. Attach Framework Middlewares
# - RequestLogMiddleware: Injects correlation IDs (x-request-id) and logs metrics
# - ScopedDependencyMiddleware: Allocates request-scoped IoC boundaries and AsyncSessions
app.add_middleware(RequestLogMiddleware)
app.add_middleware(ScopedDependencyMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-request-id"],
)

# 8. Mount Static Storage Directory for Uploaded Assets
os.makedirs(settings.STORAGE_PATH, exist_ok=True)
app.mount(
    settings.STORAGE_URL_PREFIX,
    StaticFiles(directory=settings.STORAGE_PATH),
    name="storage",
)

# 9. Register Unified Exception Handlers (ResponseWrapper formatting)
register_exception_handlers(app)


# Root Healthcheck Endpoint
@app.get("/", tags=["Health"])
async def root():
    """Global system status and active framework environment metadata."""
    return {
        "status": "healthy",
        "service": "ZShop API",
        "framework": "fastapi-zcore-framework",
        "version": "0.1.0-rc.2",
        "debug": settings.DEBUG,
    }