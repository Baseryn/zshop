from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ProductContract(Protocol):
    """Domain boundary contract specifying required catalog/inventory interactions.
    
    Prevents hard coupling between Orders and Catalog repositories.
    """

    async def get(self, *criterion: Any, **filters: Any) -> Any:
        ...

    async def adjust_stock(self, product_id: Any, quantity_delta: int) -> Any:
        ...