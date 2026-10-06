"""Background processing tasks for the Orders module.

Showcases ZCore's @background_task decorator: creates an isolated dependency
injection scope and fresh database session, eliminating session-closed errors in background workers.
"""

import asyncio
import uuid

import structlog
from zcore import background_task

from .repositories import OrderRepository

logger = structlog.get_logger("zshop.orders.tasks")


@background_task
async def generate_invoice_and_notify_customer(
    order_id: uuid.UUID,
    order_repo: OrderRepository,
) -> None:
    """Asynchronous background worker generating invoice and dispatching customer notifications.
    
    Notice: 'order_repo' is automatically auto-wired and resolved from the isolated
    background IoC scope with a dedicated AsyncSession!
    """
    logger.info("Starting background invoice generation", order_id=str(order_id))

    # 1. Fetch persistent order record using freshly injected repository
    order = await order_repo.get(id=order_id)
    if not order:
        logger.error("Order not found during background invoice generation", order_id=str(order_id))
        return

    # 2. Simulate PDF rendering and external SMTP dispatch
    await asyncio.sleep(0.5)

    logger.info(
        "Invoice generated and customer notified successfully",
        order_id=str(order_id),
        customer_id=str(order.user_id),
        total=str(order.total_amount),
    )