# ZShop — FastAPI & ZCore Reference Architecture

> A practical reference implementation demonstrating modular monolith architecture, decoupled domain design, and atomic transaction management on top of FastAPI using the [ZCore Framework](https://github.com/Baseryn/zcore).

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![SQLAlchemy 2.0](https://img.shields.io/badge/SQLAlchemy-2.0%2B%20Async-D71F00.svg?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Pydantic V2](https://img.shields.io/badge/Pydantic-V2-E92063.svg?logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-gray.svg)](LICENSE)

---

## 🎯 Design Philosophy & Purpose

FastAPI is known for its speed, simplicity, and unopinionated nature. However, as applications grow from single-file APIs to multi-domain systems, developers often face repetitive structural challenges:

- **The Monolith vs. Microservices Dilemma:** Full microservices often introduce unnecessary operational overhead for small-to-medium teams, while an unstructured monolith quickly turns into tangled spaghetti code with circular imports.
- **The Rigid Framework Trade-off:** Traditional batteries-included frameworks (like Django) solve project organization, but they enforce rigid conventions, tightly coupled ORMs, and heavy abstractions that strip away developer freedom.
- **Common Backend Plumbing:** Writing repetitive DTOs for different user roles, managing cross-repository database transactions, handling session lifetimes in background tasks, and isolating domain boundaries.

**ZCore** was built to sit in the middle: a **pragmatic, complementary architectural layer** on top of FastAPI. It provides optional, modular tools to help structure projects, manage atomic transactions, and protect sensitive fields—**without enforcing a rigid structure or taking away the freedom that makes FastAPI great.**

**ZShop** is a complete, working e-commerce reference application created to show how these tools and patterns work together in a realistic codebase.

---

## 🏛️ System Architecture

ZShop is organized as a **Modular Monolith**. Each domain lives in its own isolated module under `apps/` and can be developed, tested, and maintained independently.

```
zshop/
├── alembic/                 # Async database schema migrations
├── contracts/               # Pure Python Protocol boundaries (Zero runtime coupling)
│   └── catalog.py           # ProductContract (e.g. get, adjust_stock)
├── apps/                    # Independent domain modules (Plugins)
│   ├── identity/            # Authentication, RBAC, and context hydration
│   ├── catalog/             # Product & Category management, image validation
│   ├── orders/              # Order lifecycle, inventory decrement, Unit of Work
│   └── realtime/            # Server-Sent Events (SSE) notification stream
├── src/                     # Interactive React + TypeScript showcase UI
├── scripts/
│   └── seed.py              # Sample database seeder (3 demonstration roles)
├── main.py                  # Application entry point and plugin registration
└── conftest.py              # Pytest setup with rollback fixtures
```

### Decoupled Communication Model
Domains in ZShop never import other domains' database models or repositories directly:

1. **Contracts (Protocols):** Cross-domain calls go through explicit interfaces defined in `contracts/`.
2. **Dependency Injection (IoC):** Concrete service implementations are resolved dynamically at runtime.
3. **Domain Events:** Asynchronous notifications between domains are handled via a lightweight in-memory/Redis event dispatcher.

---

## 🧩 Key Patterns Demonstrated in This Project

### 1. Context-Aware Field Masking (`Zchema`)
Instead of defining multiple redundant schemas (`ProductPublic`, `ProductManager`, `ProductCreate`), ZShop uses a single `Zchema` model. Fields flagged as restricted in the current request context are automatically omitted during JSON serialization and input validation.

```python
# apps/catalog/schemas.py
class ProductBase(Zchema):
    __model__ = "products"

    name: str
    price: Decimal
    cost_price: Decimal        # Restricted for customers; visible to managers
    supplier_notes: str | None # Internal note; stripped automatically
```

### 2. Contract-Driven Domain Decoupling
When an order is placed, the `orders` module needs to check and adjust inventory stock. Instead of importing `CatalogRepository` directly, it depends on an abstract `ProductContract`:

```python
# contracts/catalog.py
@runtime_checkable
class ProductContract(Protocol):
    async def get(self, *criterion: Any, **filters: Any) -> Any: ...
    async def adjust_stock(self, product_id: Any, quantity_delta: int) -> Any: ...
```

The concrete `ProductService` is registered in the IoC container during startup, allowing `OrderService` to receive it via constructor injection without direct domain coupling.

### 3. Re-Entrant Unit of Work & Deferred Events
Checkout operations need to be atomic: checking stock, adjusting inventory, and creating the order record must either all succeed or all fail together.

```python
# apps/orders/services.py
async def place_order(self, user_id: uuid.UUID, schema: OrderCreate) -> Orders:
    async with UnitOfWork(session=self.repository.db, dispatcher=self.dispatcher) as uow:
        for item in schema.items:
            await self.inventory_service.adjust_stock(item.product_id, -item.quantity)

        self.repository.db.add(new_order)
        await self.repository.db.flush()

        # Events are buffered and only dispatched if the physical DB commit succeeds
        uow.register_event("order.created", {"order_id": str(new_order.id), "user_id": str(user_id)})

    return new_order
```

### 4. Isolated Background Tasks (`@background_task`)
Background workers in FastAPI often crash if they try to reuse an `AsyncSession` that was closed when the HTTP request finished. The `@background_task` decorator automatically spins up an isolated execution scope with a fresh database session:

```python
# apps/orders/tasks.py
@background_task
async def generate_invoice_and_notify_customer(
    order_id: uuid.UUID,
    order_repo: OrderRepository,  # Injected with a dedicated background session
) -> None:
    order = await order_repo.get(id=order_id)
    # Safe to execute without keeping HTTP request connections open
```

### 5. Keyset Cursor Pagination & Safe Query Building
List and search endpoints support high-performance Keyset Cursor pagination (using base64 tokens) alongside dynamic filtering that respects active security restrictions.

---

## 🚦 Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** (for running the UI)
- PostgreSQL or SQLite (SQLite is used by default for zero-config local exploration)

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/Baseryn/zshop.git
cd zshop

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies (or use 'uv pip install -r requirements.txt')
pip install -r requirements.txt
```

### 2. Environment & Database Initialization

```bash
# Create local .env file
cp .env.example .env

# Run database migrations
alembic upgrade head

# Seed initial demonstration roles and catalog items
python scripts/seed.py
```

#### Seeded Test Personas

The seed script creates three demonstration accounts to test different permission layers:

| Role | Credentials | Behavior |
| :--- | :--- | :--- |
| **SuperAdmin** | `admin@zshop.io` / `SuperSecret123!` | Has `is_superuser=True`; bypasses all permission checks |
| **Store Manager** | `manager@zshop.io` / `ManagerSecret123!` | Evaluated against explicit RBAC scopes (`HasScopes`); sees full wholesale margins |
| **Customer** | `john@example.com` / `CustomerSecret123!` | Regular user; sensitive pricing fields are masked via `Zchema` |

### 3. Running the Servers

```bash
# Start Backend (runs on http://127.0.0.1:8000 — Swagger at /docs)
uvicorn main:app --reload

# Start Frontend (in a separate terminal)
npm install
npm run dev
# (Runs on http://localhost:5173)
```

---

## 🖥️ Interactive Showcase UI

The included frontend is a tool to help visualize how the backend behaves in real time:

- **1-Click Persona Switcher:** Switch between SuperAdmin, Store Manager, Customer, and Guest in the header to observe how responses and permissions change.
- **Live DevTools Dock:**
  - **Context & Zchema Tab:** Inspect the active request context, permissions, and masked field paths.
  - **Network Tracker:** View response times and inspect correlation IDs (`x-request-id`).
  - **Dynamic Schema Tab:** Fetch `GET /catalog/products/?schema=true` to see how OpenAPI schemas adapt dynamically based on user roles.
  - **SSE Event Log:** Watch real-time Server-Sent Events emitted by the server.
- **Interactive Triggers:** A "Test Deficit Rollback" button in the cart lets you verify that stock errors safely roll back transactions without saving partial state.

---

## 🧪 Testing

Tests run against an isolated test database using transactional savepoints. Each test automatically rolls back upon completion, keeping test runs fast and deterministic without polluting the database:

```bash
pytest
```

---

## 🤝 Contributing & Feedback

This repository is maintained as an open-source educational reference and architectural showcase for the ZCore ecosystem. Feedback, issues, and discussions are welcome.

Distributed under the [MIT License](LICENSE).