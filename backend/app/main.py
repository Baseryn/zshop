import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI
from zcore import Kernel, settings
from zcore.db import db_manager, register_db_event_dispatcher
from zcore.exceptions import AppException, app_exception_handler
from zcore.logging import setup_logging
from zcore.web import RequestLogMiddleware, ScopedDependencyMiddleware

from app.identity.plugin import IdentityPlugin

# Initialize Structured Logging
setup_logging()

# Initialize Database Manager (SQLAlchemy Async Engine)
db_manager.init_app(
    db_url=settings.DATABASE_URL,
    pool_size=settings.POOL_SIZE,
    max_overflow=settings.MAX_OVERFLOW,
    echo=(settings.DEBUG)
)

# Initialize ZCore Kernel & Plugins
kernel = Kernel()
kernel.add_plugin(IdentityPlugin())

# Register global database event dispatcher
register_db_event_dispatcher(kernel.dispatcher)

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=kernel.lifespan
)

kernel.setup(app)

# Load Core Architectural Middlewares
app.add_middleware(RequestLogMiddleware)
app.add_middleware(ScopedDependencyMiddleware)

# Register Centralized Error Handlers
app.add_exception_handler(AppException, app_exception_handler)

@app.get("/")
async def root():
    return {
        "status": "healthy",
        "framework": "ZCore",
        "debug": settings.DEBUG
    }
