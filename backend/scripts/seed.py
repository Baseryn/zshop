"""Database initialization and seeding script for ZShop.

Provisions database tables and sets up a complete 3-tier user ecosystem:
1. SuperAdmin (Bypasses all checks via is_superuser=True)
2. StoreManager (Demonstrates granular scope evaluation via HasScopes)
3. Customer (Demonstrates contextual field pruning via Zchema)
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from zcore import Base, Security, db_manager, settings

from apps.identity.models import Roles, Users


async def seed() -> None:
    """Run database seeding sequence."""
    print("⏳ Initializing database tables...")
    db_manager.init_app(config=settings.DATABASE)

    async with db_manager._engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created successfully.")

    async with db_manager.session() as session:
        # =====================================================================
        # 1. Define RBAC Roles
        # =====================================================================

        # Role for Store Managers (Evaluated strictly by HasScopes!)
        manager_role = Roles(
            name="StoreManager",
            description="Operational manager with catalog, stock, and order management scopes.",
            scopes=[
                # Catalog scopes
                "categories:create",
                "categories:view",
                "categories:listview",
                "categories:lookup",
                "categories:update",
                "categories:delete",
                "products:create",
                "products:view",
                "products:listview",
                "products:lookup",
                "products:update",
                "products:delete",
                # Orders scopes
                "orders:create",
                "orders:view",
                "orders:listview",
                "orders:lookup",
                "orders:update",
                "orders:delete",
                # Realtime broadcast scope
                "notifications:broadcast",
            ],
            restricted_fields=[],  # Managers see full pricing and supplier details
        )

        # Role for End Customers (Evaluated by Zchema Pruning!)
        customer_role = Roles(
            name="Customer",
            description="Regular shopping customer with restricted internal visibility.",
            scopes=[
                "categories:view",
                "categories:lookup",
                "products:view",
                "products:lookup",
                "orders:create",
                "orders:view",
            ],
            # Crucial ZCore Feature: Automatically mask confidential margins and notes
            restricted_fields=[
                "products.cost_price",
                "products.supplier_notes",
            ],
        )

        session.add_all([manager_role, customer_role])
        await session.flush()

        # =====================================================================
        # 2. Provision 3 Distinct Demonstration Users
        # =====================================================================

        # Tier 1: Platform Owner / SuperUser (Bypasses scope checks via is_superuser)
        superuser = Users(
            email="admin@zshop.io",
            username="superadmin",
            password_hash=Security.hash_password("SuperSecret123!"),
            first_name="ZShop",
            last_name="SuperAdmin",
            is_active=True,
            is_verify=True,
            is_staff=True,
            is_superuser=True,  # Automatically passes all HasScopes checks!
            roles=[],           # Needs no roles
        )

        # Tier 2: Store Manager (Tests HasScopes enforcement without superuser bypass)
        store_manager = Users(
            email="manager@zshop.io",
            username="store_manager",
            password_hash=Security.hash_password("ManagerSecret123!"),
            first_name="Alice",
            last_name="Manager",
            is_active=True,
            is_verify=True,
            is_staff=True,
            is_superuser=False,  # Evaluated purely against assigned scopes!
            roles=[manager_role],
        )

        # Tier 3: Regular Customer (Tests Zchema data pruning & customer order scoping)
        customer = Users(
            email="john@example.com",
            username="john_doe",
            password_hash=Security.hash_password("CustomerSecret123!"),
            first_name="John",
            last_name="Doe",
            is_active=True,
            is_verify=True,
            is_staff=False,
            is_superuser=False,
            roles=[customer_role],
        )

        session.add_all([superuser, store_manager, customer])
        await session.commit()

        print("🎉 Database seeded successfully with 3 demonstration tiers!")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("👑 SuperUser     : admin@zshop.io   | SuperSecret123!   (Bypasses All Scopes)")
        print("👔 Store Manager : manager@zshop.io | ManagerSecret123! (Tests HasScopes RBAC)")
        print("👤 Customer      : john@example.com | CustomerSecret123! (Tests Zchema Pruning)")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    await db_manager.close()


if __name__ == "__main__":
    asyncio.run(seed())