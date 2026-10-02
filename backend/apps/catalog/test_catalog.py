"""Functional test suite for the Catalog domain powered by ZTestClient.

Tests categories, automatic slug generation, Keyset Cursor Pagination, image upload security,
and ZCore Zchema Context-Aware Sensitive Data Masking.
"""

import io
import uuid

import pytest
from zcore.testing import ZTestClient

from main import app


@pytest.mark.asyncio
async def test_public_categories_retrieval() -> None:
    """Verify category list endpoints are publicly readable without authentication."""
    async with ZTestClient(app) as client:
        response = await client.get("/catalog/categories/")
        assert response.status_code == 200
        assert response.json()["success"] is True


@pytest.mark.asyncio
async def test_create_category_slug_generation() -> None:
    """Verify category creation automatically generates a unique URL slug."""
    category_name = f"Home Appliances {uuid.uuid4().hex[:6]}"
    payload = {
        "name": category_name,
        "description": "Household appliances",
        "is_active": True,
    }
    async with ZTestClient(
        app, user_id=uuid.uuid4(), scopes=["categories:create"]
    ) as client:
        response = await client.post("/catalog/categories/", json=payload)
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["name"] == category_name
        assert "slug" in data
        assert data["slug"].startswith("home-appliances-")


@pytest.mark.asyncio
async def test_zchema_context_aware_data_masking() -> None:
    """Verify confidential margins are visible to managers and pruned under customer context."""
    category_name = f"Hardware {uuid.uuid4().hex[:6]}"
    sku = f"SKU-{uuid.uuid4().hex[:8].upper()}"
    product_payload = {
        "name": "Precision Power Drill",
        "sku": sku,
        "description": "High-torque industrial tool",
        "price": 180.00,
        "cost_price": 60.00,
        "supplier_notes": "Factory wholesale agreement note.",
        "stock_quantity": 25,
        "is_active": True,
    }

    async with ZTestClient(
        app,
        user_id=uuid.uuid4(),
        scopes=["categories:create", "products:create", "products:view"],
    ) as manager:
        cat_resp = await manager.post(
            "/catalog/categories/", json={"name": category_name}
        )
        assert cat_resp.status_code == 201
        category_id = cat_resp.json()["data"]["id"]

        product_payload["category_id"] = category_id
        create_resp = await manager.post("/catalog/products/", json=product_payload)
        assert create_resp.status_code == 201
        product_id = create_resp.json()["data"]["id"]

        manager_view = await manager.get(f"/catalog/products/{product_id}")
        assert manager_view.status_code == 200
        mgr_data = manager_view.json()["data"]
        assert float(mgr_data["cost_price"]) == 60.00
        assert mgr_data["supplier_notes"] == product_payload["supplier_notes"]

    async with ZTestClient(
        app,
        user_id=uuid.uuid4(),
        scopes=["categories:create", "products:create", "products:view"],
        extra_user_attrs={
            "restricted_fields": frozenset(
                ["products.view.cost_price", "products.view.supplier_notes"]
            )
        },
    ) as customer:
        cust_cat_resp = await customer.post(
            "/catalog/categories/", json={"name": f"CustCat_{uuid.uuid4().hex[:6]}"}
        )
        product_payload["category_id"] = cust_cat_resp.json()["data"]["id"]
        product_payload["sku"] = f"SKU-CUST-{uuid.uuid4().hex[:6].upper()}"

        cust_prod_resp = await customer.post(
            "/catalog/products/", json=product_payload
        )
        assert cust_prod_resp.status_code == 201
        masked_id = cust_prod_resp.json()["data"]["id"]

        customer_view = await customer.get(f"/catalog/products/{masked_id}")
        assert customer_view.status_code == 200
        cust_data = customer_view.json()["data"]
        assert "cost_price" not in cust_data or cust_data["cost_price"] is None
        assert (
            "supplier_notes" not in cust_data or cust_data["supplier_notes"] is None
        )
        assert float(cust_data["price"]) == 180.00


@pytest.mark.asyncio
async def test_dynamic_schema_generation_endpoint() -> None:
    """Verify ?schema=true query generates dynamic JSON Schema definitions on demand."""
    async with ZTestClient(app) as client:
        response = await client.get("/catalog/products/?schema=true")
        assert response.status_code == 200
        payload = response.json()
        assert payload["success"] is True
        assert "properties" in payload["data"]


@pytest.mark.asyncio
async def test_product_lookup_projection() -> None:
    """Verify lightweight lookup projection endpoint returns unmasked minimal payloads."""
    lookup_request = {
        "filters": [],
        "size": 5,
    }
    async with ZTestClient(app) as client:
        response = await client.post("/catalog/products/lookup", json=lookup_request)
        assert response.status_code == 200
        body = response.json()
        assert body["success"] is True
        assert isinstance(body["data"], list)


@pytest.mark.asyncio
async def test_upload_product_cover_image_validation() -> None:
    """Verify upload endpoint enforces Magic Byte inspections and rejects non-whitelisted files."""
    async with ZTestClient(
        app,
        user_id=uuid.uuid4(),
        scopes=["categories:create", "products:create"],
    ) as client:
        category_response = await client.post(
            "/catalog/categories/",
            json={"name": f"Garden {uuid.uuid4().hex[:6]}"},
        )
        category_id = category_response.json()["data"]["id"]

        product_response = await client.post(
            "/catalog/products/",
            json={
                "category_id": category_id,
                "name": "Garden Hose",
                "sku": f"HOSE-{uuid.uuid4().hex[:6].upper()}",
                "price": 25.00,
                "cost_price": 8.00,
                "stock_quantity": 10,
            },
        )
        product_id = product_response.json()["data"]["id"]

        script_content = b"<?php echo 'forbidden'; ?>"
        malicious_upload = {
            "file": ("script.php", io.BytesIO(script_content), "image/jpeg")
        }
        rejected_response = await client.post(
            f"/catalog/products/{product_id}/image",
            files=malicious_upload,
        )
        assert rejected_response.status_code == 400

        valid_png_signature = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        valid_upload = {
            "file": ("photo.png", io.BytesIO(valid_png_signature), "image/png")
        }
        accepted_response = await client.post(
            f"/catalog/products/{product_id}/image",
            files=valid_upload,
        )
        assert accepted_response.status_code == 200
        assert accepted_response.json()["data"]["image_url"] is not None