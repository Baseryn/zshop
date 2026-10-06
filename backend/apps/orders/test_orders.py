"""Functional test suite for the Orders domain powered by ZTestClient.

Tests atomic order placement via UnitOfWork, inventory adjustments via ProductContract,
customer ownership isolation, and fulfillment state transitions.
"""

import uuid

import pytest
from zcore.testing import ZTestClient

from main import app


async def _create_test_product(
    client, stock: int = 10, price: float = 100.0
) -> uuid.UUID:
    """Create a verified category and product record for order testing."""
    cat_resp = await client.post(
        "/catalog/categories/",
        json={"name": f"CheckoutCat_{uuid.uuid4().hex[:6]}"},
    )
    category_id = cat_resp.json()["data"]["id"]

    prod_resp = await client.post(
        "/catalog/products/",
        json={
            "category_id": category_id,
            "name": "Checkout Item",
            "sku": f"CHECKOUT-{uuid.uuid4().hex[:6].upper()}",
            "price": price,
            "cost_price": 40.0,
            "stock_quantity": stock,
            "is_active": True,
        },
    )
    return uuid.UUID(prod_resp.json()["data"]["id"])


@pytest.mark.asyncio
async def test_atomic_order_placement_and_inventory_decrement() -> None:
    """Verify order placement commits atomically and decrements stock via ProductContract."""
    uid = uuid.uuid4()
    scopes = [
        "categories:create",
        "products:create",
        "orders:create",
        "products:view",
    ]
    async with ZTestClient(app, user_id=uid, scopes=scopes) as client:
        product_id = await _create_test_product(client, stock=10, price=60.0)

        order_payload = {
            "shipping_address": "100 Innovation Boulevard, Tech Park",
            "items": [
                {
                    "product_id": str(product_id),
                    "quantity": 4,
                }
            ],
        }
        order_response = await client.post(
            "/checkout/orders/", json=order_payload
        )
        assert order_response.status_code == 201
        order_data = order_response.json()["data"]
        assert float(order_data["total_amount"]) == 240.00
        assert order_data["status"] == "pending"

        product_view = await client.get(f"/catalog/products/{product_id}")
        assert product_view.json()["data"]["stock_quantity"] == 6


@pytest.mark.asyncio
async def test_order_placement_insufficient_stock_fails_atomically() -> None:
    """Verify deficit requests are rejected without corrupting inventory or creating orders."""
    uid = uuid.uuid4()
    scopes = ["categories:create", "products:create", "orders:create", "products:view"]
    async with ZTestClient(app, user_id=uid, scopes=scopes) as client:
        product_id = await _create_test_product(client, stock=3, price=30.0)

        order_payload = {
            "shipping_address": "200 Warehouse Row",
            "items": [
                {
                    "product_id": str(product_id),
                    "quantity": 10,
                }
            ],
        }
        order_response = await client.post(
            "/checkout/orders/", json=order_payload
        )
        assert order_response.status_code == 400

        product_view = await client.get(f"/catalog/products/{product_id}")
        assert product_view.json()["data"]["stock_quantity"] == 3


@pytest.mark.asyncio
async def test_customer_order_ownership_isolation() -> None:
    """Verify customer accounts cannot view orders placed by other customer accounts."""
    customer_a_id = uuid.uuid4()
    customer_b_id = uuid.uuid4()

    async with ZTestClient(
        app,
        user_id=customer_a_id,
        scopes=["categories:create", "products:create", "orders:create", "orders:view"],
    ) as client_a:
        product_id = await _create_test_product(client_a, stock=5, price=20.0)
        order_payload = {
            "shipping_address": "Confidential Address",
            "items": [{"product_id": str(product_id), "quantity": 1}],
        }
        order_response = await client_a.post(
            "/checkout/orders/", json=order_payload
        )
        order_id = order_response.json()["data"]["id"]

        owner_view = await client_a.get(f"/checkout/orders/{order_id}")
        assert owner_view.status_code == 200

    async with ZTestClient(
        app,
        user_id=customer_b_id,
        scopes=["orders:view"],
    ) as client_b:
        denied_response = await client_b.get(f"/checkout/orders/{order_id}")
        assert denied_response.status_code == 403


@pytest.mark.asyncio
async def test_update_order_status_by_manager() -> None:
    """Verify operational staff can transition order fulfillment states."""
    uid = uuid.uuid4()
    scopes = [
        "categories:create",
        "products:create",
        "orders:create",
        "orders:update",
    ]
    async with ZTestClient(app, user_id=uid, scopes=scopes) as client:
        product_id = await _create_test_product(client, stock=5, price=15.0)
        order_response = await client.post(
            "/checkout/orders/",
            json={
                "shipping_address": "Logistics Hub",
                "items": [{"product_id": str(product_id), "quantity": 1}],
            },
        )
        order_id = order_response.json()["data"]["id"]

        patch_payload = {
            "status": "shipped",
            "tracking_code": "TRACK-EXPRESS-1234",
        }
        patch_response = await client.patch(
            f"/checkout/orders/{order_id}/status",
            json=patch_payload,
        )
        assert patch_response.status_code == 200
        updated_data = patch_response.json()["data"]
        assert updated_data["status"] == "shipped"
        assert updated_data["tracking_code"] == "TRACK-EXPRESS-1234"