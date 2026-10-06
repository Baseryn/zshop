# ⚡ ZShop Backend — ZCore Reference Implementation

> **Enterprise-grade, Production-Ready Modular Monolith E-Commerce backend built with [FastAPI](https://fastapi.tiangolo.com/) and powered by [ZCore Framework](https://github.com/Baseryn/zcore).**

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![SQLAlchemy 2.0](https://img.shields.io/badge/SQLAlchemy-2.0+-red.svg)](https://www.sqlalchemy.org/)
[![Pydantic V2](https://img.shields.io/badge/Pydantic-V2-e92063.svg)](https://docs.pydantic.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Executive Summary

FastAPI excels at the HTTP routing layer, but real-world enterprise backends quickly encounter architectural pitfalls: leaky abstractions between domains, repetitive DTOs for role-based responses, broken transactional boundaries across repositories, and dangling database sessions in background workers.

**ZShop** is the definitive reference implementation for **ZCore Framework**, demonstrating how to structure high-throughput, enterprise-ready Python applications using **Clean Architecture**, **Domain-Driven Design (DDD)**, and **Event-Driven Modular Monolith** patterns without sacrificing FastAPI's developer ergonomics.

---

## 🏛️ Architectural Blueprint

ZShop enforces strict domain isolation. Subsystems never import another domain's internal models or repositories directly; communication occurs exclusively through **Protocols (Contracts)**, **Asynchronous Inversion-of-Control (IoC)**, or **Deferred Domain Events**.

```
zshop-backend/
├── alembic/                 # Asynchronous schema migrations (asyncpg/PostgreSQL)
├── contracts/               # Pure Python Protocol boundaries (Zero runtime coupling)
│   └── catalog.py           # ProductContract (get, adjust_stock)
├── apps/                    # Independent domain plugins (DAG ordered)
│   ├── identity/            # RBAC, Argon2id, JWT auth backend, context hydration
│   ├── catalog/             # Products & Categories, Keyset Cursor, secure storage
│   ├── orders/              # Atomic UoW, stock decrement, event emission
│   └── realtime/            # SSE streaming, Redis PubSub, live notification dispatch
├── scripts/
│   └── seed.py              # Multi-tier RBAC database provisioner
├── main.py                  # Kernel bootstrapping, DAG resolution, middleware chain
└── conftest.py              # Zero-boilerplate test suite harness
```

---

## 💎 Key Architectural Patterns in Action

### 1. Context-Aware Sensitive Data Masking (`Zchema`)
Traditional APIs maintain duplicative schemas (`ProductPublic`, `ProductAdmin`, `ProductSupplier`). ZShop uses a **single declarative `Zchema`** that dynamically prunes confidential fields during serialization, input validation, and OpenAPI generation.

```python
# apps/catalog/schemas.py
class ProductBase(Zchema):
    __model__ = "products"

    name: str
    price: Decimal
    cost_price: Decimal      # 🔒 Confidential Margin
    supplier_notes: str | None # 🔒 Internal Supplier Terms
```

* **Customer Perspective (`ctx.restricted_fields = {"products.cost_price", "products.supplier_notes"}`):**
  Receives only public retail pricing; sensitive fields are completely omitted from JSON payloads.
* **Store Manager Perspective:**
  Receives complete wholesale transparency across the identical endpoint (`GET /catalog/products/{id}`).
* **CDN & Proxy Protection:**
  When response data is pruned, ZCore automatically attaches `Vary: Authorization, Cookie` headers to eliminate CDN cache poisoning.

---

### 2. Contract-Driven Decoupling via IoC
The `orders` domain must decrement product stock upon checkout. To avoid circular dependencies and tight database coupling, it interacts strictly with an abstract `ProductContract`:

```python
# contracts/catalog.py
@runtime_checkable
class ProductContract(Protocol):
    async def get(self, *criterion: Any, **filters: Any) -> Any: ...
    async def adjust_stock(self, product_id: Any, quantity_delta: int) -> Any: ...
```

The `CatalogPlugin` registers its concrete `ProductService` into the IoC container during application setup:

```python
# apps/catalog/plugin.py
container.register_scoped(ProductContract, ProductService)
```

`OrderService` simply declares `ProductContract` in its constructor—ZCore's IoC container auto-wires the dependency at runtime without manual `Depends()` chaining.

---

### 3. Re-Entrant Unit of Work & Deferred Domain Events
A checkout transaction must atomically verify inventory, decrement stock, and record the purchase order. If any line item fails, all state changes roll back:

```python
# apps/orders/services.py
async def place_order(self, user_id: uuid.UUID, schema: OrderCreate) -> Orders:
    async with UnitOfWork(session=self.repository.db, dispatcher=self.dispatcher) as uow:
        # 1. Adjust inventory via decoupled contract
        for item in schema.items:
            await self.inventory_service.adjust_stock(item.product_id, -item.quantity)
        
        # 2. Persist order entity
        self.repository.db.add(new_order)
        await self.repository.db.flush()

        # 3. Buffer domain event (Dispatched ONLY after physical commit succeeds)
        uow.register_event("order.created", {"order_id": str(new_order.id), "user_id": str(user_id)})

    return new_order
```

* **No Premature Side-Effects:** If a database commit fails, the registered `order.created` event is discarded, preventing phantom customer emails or spurious push notifications.
* **Re-Entrant Depth Tracking:** Nested UoW calls only flush to database savepoints; the outermost UoW boundary executes the physical commit.

---

### 4. Event-Driven Realtime Streaming (SSE + Redis PubSub)
The `realtime` domain subscribes to domain occurrences via `@on_event` without having any knowledge of the order database:

```python
# apps/realtime/services.py
@on_event("order.created")
async def handle_order_created(self, payload: dict[str, Any]) -> None:
    await self.emit_to_user(
        user_id=uuid.UUID(payload["user_id"]),
        event="order.created",
        title="Order Confirmed!",
        message=f"Order #{payload['order_id'][:8]} placed successfully.",
        data=payload
    )
```

Clients subscribe over standard Server-Sent Events via `GET /realtime/stream`, receiving updates directly through bounded in-memory queues or cluster-wide Redis channels.

---

### 5. Isolated Background Tasks (`@background_task`)
Passing request-scoped database sessions to background threads in FastAPI leads to `InterfaceError: Session is closed`. ZShop leverages ZCore's `@background_task` decorator:

```python
# apps/orders/tasks.py
@background_task
async def generate_invoice_and_notify_customer(
    order_id: uuid.UUID,
    order_repo: OrderRepository,  # Automatically auto-wired with a fresh session!
) -> None:
    order = await order_repo.get(id=order_id)
    # Background generation executes safely inside its own IoC & DB lifecycle
```

---

### 6. Keyset Cursor Pagination & Dynamic Search
Instead of slow `OFFSET / LIMIT` scans that degrade on large datasets, ZShop implements high-performance **Base64 Keyset Cursor Pagination**:

```http
POST /catalog/products/search
Content-Type: application/json

{
  "filters": [
    {"field": "price", "op": "between", "value": [50.00, 250.00]},
    {"field": "is_active", "op": "eq", "value": true}
  ],
  "sort": [{"field": "created_at", "order": "desc"}],
  "size": 20,
  "cursor": "eyJ2YWx1ZSI6ICIyMDI2LTA5LTI1VDA2OjU3OjE2LjYzNzc3OSswMDowMCIsICJwayI6ICI..."
}
```

---

## 🚦 Getting Started

### Prerequisites
* **Python 3.11+**
* **PostgreSQL** (or SQLite for lightweight exploration)
* **Redis** (Optional, for cluster pub/sub and distributed caching)
* Recommended: [`uv`](https://github.com/astral-sh/uv) (Extremely fast Python package manager)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/Baseryn/zshop.git
cd zshop/backend

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate
uv pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and verify database credentials:

```bash
cp .env.example .env
```

Key environment configurations:
```ini
DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/zshop_dev
DATABASE_TEST_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/zshop_test
SECRET_KEY=9f83a21bce47d31f08e9a4cb390234acfe7b198234ea68b0c95ef3281048e712
REDIS_URL=redis://127.0.0.1:6379/0
```

### 3. Run Migrations & Seed Data

```bash
# Apply Alembic schema migrations
alembic upgrade head

# Seed initial multi-tier demonstration accounts & catalog items
python scripts/seed.py
```

The seeder provisions three demonstration personas:

| Role | Username / Email | Password | Primary Feature Highlight |
| :--- | :--- | :--- | :--- |
| **SuperAdmin** | `admin@zshop.io` | `SuperSecret123!` | Complete bypass of all permission scopes (`is_superuser=True`) |
| **Store Manager** | `manager@zshop.io` | `ManagerSecret123!` | Evaluated against explicit RBAC scopes (`HasScopes`) |
| **Customer** | `john@example.com` | `CustomerSecret123!` | Visualizes automatic data pruning (`Zchema`) & customer isolation |

### 4. Start the Application

You can launch using the **ZCore CLI** or standard **Uvicorn**:

```bash
# Using ZCore CLI Runner (Cascading config resolution)
zc run

# Or directly via Uvicorn
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

* **Interactive OpenAPI Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Healthcheck:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

---

## 🧪 Testing Harness

ZShop leverages ZCore's native test engine (`ZTestClient`). Tests execute inside **transactional savepoint rollbacks**, ensuring lightning-fast execution and zero database pollution between test runs:

```bash
# Run the entire test suite with coverage
pytest
```

What gets validated out of the box:
* ✅ Public category browsing vs authenticated mutations
* ✅ Automatic URL slug generation and conflict resolution
* ✅ Context-aware field masking for Customers vs Managers
* ✅ Atomic order checkout with inventory rollback on deficit
* ✅ Customer order ownership scoping (Multi-tenancy isolation)
* ✅ Binary Magic-Byte inspection against malicious file uploads (XSS/PHP blocks)
* ✅ Persistent Server-Sent Events (SSE) handshakes and broadcast permissions

---

## 📜 License

Distributed under the **MIT License**. Developed with ❤️ by **[Baseryn](https://github.com/Baseryn)**.