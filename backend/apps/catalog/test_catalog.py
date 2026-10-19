"""Functional test suite for the Catalog domain powered by ZTestClient.

Tests categories, automatic slug generation, Keyset Cursor Pagination, image upload security,
Soft-Delete lifecycle, concurrency protection, and ZCore Zchema Context-Aware Sensitive Data Masking.
"""

import io
import uuid

import pytest
from zcore import container
from zcore.testing import ZTestClient

from apps.catalog.services import ProductService
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
async def test_create_category_duplicate_name_conflict() -> None:
    """Verify attempting to create a category with a duplicate name raises Conflict (409)."""
    category_name = f"Duplicate Cat {uuid.uuid4().hex[:6]}"
    payload = {"name": category_name, "is_active": True}
    async with ZTestClient(
        app, user_id=uuid.uuid4(), scopes=["categories:create"]
    ) as client:
        resp1 = await client.post("/catalog/categories/", json=payload)
        assert resp1.status_code == 201

        resp2 = await client.post("/catalog/categories/", json=payload)
        assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_category_hierarchy_parent_child() -> None:
    """Verify category parent-child self-referencing relationship."""
    async with ZTestClient(
        app, user_id=uuid.uuid4(), scopes=["categories:create", "categories:view"]
    ) as client:
        parent_resp = await client.post(
            "/catalog/categories/",
            json={"name": f"Parent Cat {uuid.uuid4().hex[:6]}"},
        )
        assert parent_resp.status_code == 201
        parent_id = parent_resp.json()["data"]["id"]

        child_resp = await client.post(
            "/catalog/categories/",
            json={
                "name": f"Child Cat {uuid.uuid4().hex[:6]}",
                "parent_id": parent_id,
            },
        )
        assert child_resp.status_code == 201
        assert child_resp.json()["data"]["parent_id"] == parent_id


@pytest.mark.asyncio
async def test_category_unauthorized_mutation_forbidden() -> None:
    """Verify unprivileged customer role cannot create or modify categories."""
    payload = {"name": f"Unauthorized {uuid.uuid4().hex[:6]}"}
    async with ZTestClient(
        app, user_id=uuid.uuid4(), scopes=["categories:view"]
    ) as client:
        response = await client.post("/catalog/categories/", json=payload)
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_product_success_and_duplicate_sku_rejection() -> None:
    """Verify product creation succeeds and duplicate SKU is rejected with 409."""
    async with ZTestClient(
        app,
        user_id=uuid.uuid4(),
        scopes=["categories:create", "products:create", "products:view"],
    ) as client:
        cat_resp = await client.post(
            "/catalog/categories/",
            json={"name": f"Electronics {uuid.uuid4().hex[:6]}"},
        )
        category_id = cat_resp.json()["data"]["id"]

        sku = f"SKU-{uuid.uuid4().hex[:8].upper()}"
        payload = {
            "category_id": category_id,
            "name": "Smart Speaker",
            "sku": sku,
            "price": 99.00,
            "cost_price": 40.00,
            "supplier_notes": "Tier 1 vendor note.",
            "stock_quantity": 50,
            "is_active": True,
        }

        resp1 = await client.post("/catalog/products/", json=payload)
        assert resp1.status_code == 201

        resp2 = await client.post("/catalog/products/", json=payload)
        assert resp2.status_code == 409


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

        vary_header = customer_view.headers.get("vary", "")
        assert "authorization" in vary_header.lower()
        assert "cookie" in vary_header.lower()


@pytest.mark.asyncio
async def test_zchema_input_mass_assignment_protection() -> None:
    """Verify unauthorized users cannot overwrite restricted fields via request body payloads."""
    async with ZTestClient(
        app,
        user_id=uuid.uuid4(),
        is_superuser=True,
    ) as admin:
        cat_resp = await admin.post(
            "/catalog/categories/", json={"name": f"MassAssignCat_{uuid.uuid4().hex[:6]}"}
        )
        cat_id = cat_resp.json()["data"]["id"]

        initial_prod = await admin.post(
            "/catalog/products/",
            json={
                "category_id": cat_id,
                "name": "Target Product",
                "sku": f"TARGET-{uuid.uuid4().hex[:6].upper()}",
                "price": 100.0,
                "cost_price": 50.0,
                "stock_quantity": 10,
            },
        )
        assert initial_prod.status_code == 201
        prod_id = initial_prod.json()["data"]["id"]

    async with ZTestClient(
        app,
        user_id=uuid.uuid4(),
        scopes=["products:update", "products:view"],
        extra_user_attrs={
            "restricted_fields": frozenset(["products.cost_price", "products.supplier_notes"])
        },
    ) as restricted_user:
        update_attempt = await restricted_user.patch(
            f"/catalog/products/{prod_id}",
            json={
                "price": 110.0,
                "cost_price": 1.0,
                "supplier_notes": "Attempted hostile injection",
            },
        )
        assert update_attempt.status_code == 200

    async with ZTestClient(app, user_id=uuid.uuid4(), is_superuser=True) as admin:
        verified_view = await admin.get(f"/catalog/products/{prod_id}")
        assert verified_view.status_code == 200
        actual_data = verified_view.json()["data"]
        assert float(actual_data["price"]) == 110.0
        assert float(actual_data["cost_price"]) == 50.0
        assert actual_data["supplier_notes"] is None or actual_data["supplier_notes"] != "Attempted hostile injection"


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
async def test_product_keyset_cursor_pagination_multi_page() -> None:
    """Verify multi-page keyset cursor pagination traverses successive pages without record collisions."""
    async with ZTestClient(
        app,
        user_id=uuid.uuid4(),
        scopes=["categories:create", "products:create", "products:view", "products:listview"],
    ) as client:
        cat_resp = await client.post(
            "/catalog/categories/",
            json={"name": f"CursorCat_{uuid.uuid4().hex[:6]}"},
        )
        cat_id = cat_resp.json()["data"]["id"]

        for i in range(5):
            await client.post(
                "/catalog/products/",
                json={
                    "category_id": cat_id,
                    "name": f"Cursor Item {i:02d}",
                    "sku": f"CUR-{uuid.uuid4().hex[:6].upper()}",
                    "price": 50.0 + i,
                    "cost_price": 10.0,
                    "stock_quantity": 5,
                },
            )

        page1_req = {
            "filters": [],
            "sort": [{"field": "price", "order": "desc"}],
            "size": 2,
        }
        res1 = await client.post("/catalog/products/search", json=page1_req)
        assert res1.status_code == 200
        body1 = res1.json()
        assert len(body1["data"]) == 2
        assert body1["meta"]["has_more"] is True
        next_cursor = body1["meta"]["next_cursor"]
        assert next_cursor is not None

        page2_req = {
            "filters": [],
            "sort": [{"field": "price", "order": "desc"}],
            "cursor": next_cursor,
            "size": 2,
        }
        res2 = await client.post("/catalog/products/search", json=page2_req)
        assert res2.status_code == 200
        body2 = res2.json()
        assert len(body2["data"]) == 2

        page1_ids = {item["id"] for item in body1["data"]}
        page2_ids = {item["id"] for item in body2["data"]}
        assert page1_ids.isdisjoint(page2_ids)


@pytest.mark.asyncio
async def test_search_rejects_conflicting_cursor_and_page() -> None:
    """Verify SearchRequest rejects simultaneous cursor and page > 1 parameters with 422."""
    async with ZTestClient(app) as client:
        conflict_payload = {
            "page": 2,
            "cursor": "valid_mock_cursor_token",
            "size": 10,
        }
        response = await client.post("/catalog/products/search", json=conflict_payload)
        assert response.status_code == 422
        assert "Cannot combine 'cursor' with 'page' > 1" in response.json()["message"]


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
async def test_product_soft_delete_lifecycle() -> None:
    """Verify soft-delete marks records without physical purge, while force=true permanently deletes."""
    async with ZTestClient(
        app,
        user_id=uuid.uuid4(),
        scopes=[
            "categories:create",
            "products:create",
            "products:view",
            "products:delete",
        ],
    ) as client:
        cat_resp = await client.post(
            "/catalog/categories/",
            json={"name": f"DeleteCat_{uuid.uuid4().hex[:6]}"},
        )
        cat_id = cat_resp.json()["data"]["id"]

        prod_resp = await client.post(
            "/catalog/products/",
            json={
                "category_id": cat_id,
                "name": "Deletable Item",
                "sku": f"DEL-{uuid.uuid4().hex[:6].upper()}",
                "price": 30.0,
                "cost_price": 10.0,
                "stock_quantity": 1,
            },
        )
        prod_id = prod_resp.json()["data"]["id"]

        del_resp = await client.delete(f"/catalog/products/{prod_id}")
        assert del_resp.status_code == 200

        get_resp = await client.get(f"/catalog/products/{prod_id}")
        assert get_resp.status_code == 404

        force_del_resp = await client.delete(f"/catalog/products/{prod_id}?force=true")
        assert force_del_resp.status_code == 200


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


@pytest.mark.asyncio
async def test_upload_product_file_extension_rejection() -> None:
    """Verify upload endpoint rejects files with dangerous extensions."""
    async with ZTestClient(
        app, user_id=uuid.uuid4(), scopes=["categories:create", "products:create"]
    ) as client:
        cat_resp = await client.post(
            "/catalog/categories/", json={"name": f"Tools_{uuid.uuid4().hex[:6]}"}
        )
        prod_resp = await client.post(
            "/catalog/products/",
            json={
                "category_id": cat_resp.json()["data"]["id"],
                "name": "Hammer",
                "sku": f"HAM-{uuid.uuid4().hex[:6].upper()}",
                "price": 15.0,
                "cost_price": 5.0,
            },
        )
        prod_id = prod_resp.json()["data"]["id"]

        exe_upload = {
            "file": ("payload.exe", io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00"), "application/octet-stream")
        }
        resp = await client.post(f"/catalog/products/{prod_id}/image", files=exe_upload)
        assert resp.status_code == 400


@pytest.mark.asyncio
async def test_upload_product_file_size_limit() -> None:
    """Verify upload endpoint rejects files that exceed the 3MB size limit."""
    async with ZTestClient(
        app, user_id=uuid.uuid4(), scopes=["categories:create", "products:create"]
    ) as client:
        cat_resp = await client.post(
            "/catalog/categories/", json={"name": f"Heavy_{uuid.uuid4().hex[:6]}"}
        )
        prod_resp = await client.post(
            "/catalog/products/",
            json={
                "category_id": cat_resp.json()["data"]["id"],
                "name": "Big Asset Item",
                "sku": f"BIG-{uuid.uuid4().hex[:6].upper()}",
                "price": 15.0,
                "cost_price": 5.0,
            },
        )
        prod_id = prod_resp.json()["data"]["id"]

        oversized_data = b"\x89PNG\r\n\x1a\n" + (b"0" * (4 * 1024 * 1024))
        oversized_upload = {
            "file": ("huge.png", io.BytesIO(oversized_data), "image/png")
        }
        resp = await client.post(f"/catalog/products/{prod_id}/image", files=oversized_upload)
        assert resp.status_code == 400
        assert "exceeds the limit" in resp.json()["message"]


@pytest.mark.asyncio
async def test_atomic_stock_adjustment_deficit_protection() -> None:
    """Verify adjust_stock atomically rejects negative stock adjustments with ValidationError."""
    async with ZTestClient(app, user_id=uuid.uuid4(), is_superuser=True) as client:
        cat_resp = await client.post(
            "/catalog/categories/", json={"name": f"StockCat_{uuid.uuid4().hex[:6]}"}
        )
        prod_resp = await client.post(
            "/catalog/products/",
            json={
                "category_id": cat_resp.json()["data"]["id"],
                "name": "Limited Item",
                "sku": f"LTD-{uuid.uuid4().hex[:6].upper()}",
                "price": 50.0,
                "cost_price": 20.0,
                "stock_quantity": 2,
            },
        )
        prod_id = uuid.UUID(prod_resp.json()["data"]["id"])

        product_service = container.resolve(ProductService)

        # 1. Successful deduction
        updated = await product_service.adjust_stock(prod_id, -1)
        assert updated.stock_quantity == 1

        # 2. Deficit deduction must raise ValidationError
        with pytest.raises(Exception) as exc_info:
            await product_service.adjust_stock(prod_id, -5)
        assert "Insufficient stock" in str(exc_info.value)

        # 3. Stock remains intact after failed deduction
        verified = await product_service.get(id=prod_id)
        assert verified.stock_quantity == 1