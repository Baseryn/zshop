from enum import StrEnum


class OrderStatus(StrEnum):
    """Lifecycle statuses representing an order's fulfillment state."""

    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"