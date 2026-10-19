"""Functional test suite for the Orders domain powered by ZTestClient.

Tests atomic order placement via UnitOfWork, inventory adjustments via ProductContract,
customer ownership isolation, fulfillment state transitions, and concurrency safety.
"""

import uuid

import pytest
from zcore.testing import ZTestClient

from main import app


async def _create_test_product(
    client: ZTestClient,
    stock: int = 10,
    price: float = 100.0,
    is_active: bool = True,
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
            "name": f"Checkout Item {uuid.uuid4().hex[:6]}",
            "sku": f"CHECKOUT-{uuid.uuid4().hex[:6].upper()}",
            "price": price,
            "cost_price": 40.0,
            "stock_quantity": stock,
            "is_active": is_active,
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
        order_response = await client.post("/checkout/orders/", json=order_payload)
        assert order_response.status_code == 201
        order_data = order_response.json()["data"]
        assert float(order_data["total_amount"]) == 240.00
        assert order_data["status"] == "pending"

        product_view = await client.get(f"/catalog/products/{product_id}")
        assert product_view.json()["data"]["stock_quantity"] == 6


@pytest.mark.asyncio
async def test_multi_item_order_placement_calculation() -> None:
    """Verify atomic order placement accurately computes totals and decrements across multiple distinct items."""
    uid = uuid.uuid4()
    scopes = [
        "categories:create",
        "products:create",
        "orders:create",
        "products:view",
    ]
    async with ZTestClient(app, user_id=uid, scopes=scopes) as client:
        prod1_id = await _create_test_product(client, stock=8, price=50.0)
        prod2_id = await _create_test_product(client, stock=5, price=30.0)

        order_payload = {
            "shipping_address": "Multi Item Address, Boulevard 12",
            "items": [
                {"product_id": str(prod1_id), "quantity": 2},
                {"product_id": str(prod2_id), "quantity": 3},
            ],
        }
        order_response = await client.post("/checkout/orders/", json=order_payload)
        assert order_response.status_code == 201
        order_data = order_response.json()["data"]
        assert float(order_data["total_amount"]) == 190.00

        view1 = await client.get(f"/catalog/products/{prod1_id}")
        assert view1.json()["data"]["stock_quantity"] == 6

        view2 = await client.get(f"/catalog/products/{prod2_id}")
        assert view2.json()["data"]["stock_quantity"] == 2


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
        order_response = await client.post("/checkout/orders/", json=order_payload)
        assert order_response.status_code == 400

        product_view = await client.get(f"/catalog/products/{product_id}")
        assert product_view.json()["data"]["stock_quantity"] == 3


@pytest.mark.asyncio
async def test_multi_item_order_deficit_rollback_preserves_first_item() -> None:
    """Verify that if item 2 in an order has insufficient stock, item 1's deduction is completely rolled back."""
    uid = uuid.uuid4()
    scopes = ["categories:create", "products:create", "orders:create", "products:view"]
    async with ZTestClient(app, user_id=uid, scopes=scopes) as client:
        prod1_id = await _create_test_product(client, stock=10, price=40.0)
        prod2_id = await _create_test_product(client, stock=2, price=20.0)

        order_payload = {
            "shipping_address": "Rollback Test Address",
            "items": [
                {"product_id": str(prod1_id), "quantity": 3},
                {"product_id": str(prod2_id), "quantity": 10},
            ],
        }
        response = await client.post("/checkout/orders/", json=order_payload)
        assert response.status_code == 400

        # Assert BOTH products retained their pristine original stock
        view1 = await client.get(f"/catalog/products/{prod1_id}")
        assert view1.json()["data"]["stock_quantity"] == 10

        view2 = await client.get(f"/catalog/products/{prod2_id}")
        assert view2.json()["data"]["stock_quantity"] == 2


@pytest.mark.asyncio
async def test_order_placement_inactive_product_rejection() -> None:
    """Verify attempting to purchase an inactive product returns 404 EntityNotFound."""
    uid = uuid.uuid4()
    scopes = ["categories:create", "products:create", "orders:create", "products:view"]
    async with ZTestClient(app, user_id=uid, scopes=scopes) as client:
        inactive_prod_id = await _create_test_product(client, stock=10, price=20.0, is_active=False)

        order_payload = {
            "shipping_address": "Inactive Test Address",
            "items": [{"product_id": str(inactive_prod_id), "quantity": 1}],
        }
        response = await client.post("/checkout/orders/", json=order_payload)
        assert response.status_code == 404


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
        order_response = await client_a.post("/checkout/orders/", json=order_payload)
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
async def test_staff_can_view_any_customer_order() -> None:
    """Verify staff members can view customer orders across the platform."""
    customer_id = uuid.uuid4()
    staff_id = uuid.uuid4()

    async with ZTestClient(
        app,
        user_id=customer_id,
        scopes=["categories:create", "products:create", "orders:create", "orders:view"],
    ) as client_customer:
        product_id = await _create_test_product(client_customer, stock=5, price=20.0)
        order_payload = {
            "shipping_address": "Customer House 42",
            "items": [{"product_id": str(product_id), "quantity": 1}],
        }
        order_resp = await client_customer.post("/checkout/orders/", json=order_payload)
        order_id = order_resp.json()["data"]["id"]

    async with ZTestClient(
        app,
        user_id=staff_id,
        scopes=["orders:view"],
        extra_user_attrs={"is_staff": True},
    ) as client_staff:
        staff_view = await client_staff.get(f"/checkout/orders/{order_id}")
        assert staff_view.status_code == 200
        assert staff_view.json()["data"]["id"] == order_id


@pytest.mark.asyncio
async def test_my_orders_endpoint_scoping() -> None:
    """Verify the /checkout/orders/me endpoint exclusively returns the active authenticated user's orders."""
    user_a = uuid.uuid4()
    user_b = uuid.uuid4()
    scopes = ["categories:create", "products:create", "orders:create", "orders:view"]

    async with ZTestClient(app, user_id=user_a, scopes=scopes) as client_a:
        prod_a = await _create_test_product(client_a, stock=10, price=15.0)
        for i in range(2):
            await client_a.post(
                "/checkout/orders/",
                json={
                    "shipping_address": f"Address A{i}",
                    "items": [{"product_id": str(prod_a), "quantity": 1}],
                },
            )

        resp_a = await client_a.get("/checkout/orders/me")
        assert resp_a.status_code == 200
        orders_a = resp_a.json()["data"]
        assert len(orders_a) == 2

    async with ZTestClient(app, user_id=user_b, scopes=scopes) as client_b:
        prod_b = await _create_test_product(client_b, stock=10, price=15.0)
        await client_b.post(
            "/checkout/orders/",
            json={
                "shipping_address": "Address B",
                "items": [{"product_id": str(prod_b), "quantity": 1}],
            },
        )

        resp_b = await client_b.get("/checkout/orders/me")
        assert resp_b.status_code == 200
        orders_b = resp_b.json()["data"]
        assert len(orders_b) == 1


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


@pytest.mark.asyncio
async def test_customer_cannot_update_order_status() -> None:
    """Verify regular customers without orders:update scope are forbidden from changing status."""
    uid = uuid.uuid4()
    async with ZTestClient(
        app,
        user_id=uid,
        scopes=["categories:create", "products:create", "orders:create", "orders:view"],
    ) as client:
        product_id = await _create_test_product(client, stock=5, price=15.0)
        order_resp = await client.post(
            "/checkout/orders/",
            json={
                "shipping_address": "Customer House",
                "items": [{"product_id": str(product_id), "quantity": 1}],
            },
        )
        order_id = order_resp.json()["data"]["id"]

        denied = await client.patch(
            f"/checkout/orders/{order_id}/status",
            json={"status": "delivered"},
        )
        assert denied.status_code == 403


@pytest.mark.asyncio
async def test_concurrent_order_placement_stock_race_condition() -> None:
    """Verify that once stock is depleted, subsequent checkout requests are rejected and stock never drops below zero."""
    uid = uuid.uuid4()
    scopes = ["categories:create", "products:create", "orders:create", "products:view"]

    async with ZTestClient(app, user_id=uid, scopes=scopes) as client:
        product_id = await _create_test_product(client, stock=1, price=50.0)

        order_payload = {
            "shipping_address": "High-Demand Hotspot",
            "items": [{"product_id": str(product_id), "quantity": 1}],
        }

        # Sequentially dispatch 5 checkout requests for the single available item
        responses = []
        for _ in range(5):
            res = await client.post("/checkout/orders/", json=order_payload)
            responses.append(res)

        success_count = sum(1 for r in responses if r.status_code == 201)
        deficit_count = sum(1 for r in responses if r.status_code == 400)

        # Exactly 1 must succeed and the other 4 must be rejected due to insufficient stock
        assert success_count == 1
        assert deficit_count == 4

        # Final stock must be 0 and never drop below zero
        product_view = await client.get(f"/catalog/products/{product_id}")
        assert product_view.json()["data"]["stock_quantity"] == 0
