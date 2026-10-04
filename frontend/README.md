# ⚡ ZShop Frontend — Interactive UI & Live Inspector Dock

> **Modern, High-Performance Showcase Frontend built with React, TypeScript, Vite, Tailwind CSS, and Radix UI — Designed specifically to explore the [ZCore Framework](https://github.com/Baseryn/zcore).**

---

## 📖 Overview

The **ZShop Frontend** is not just an e-commerce storefront; it is an **interactive developer playground** designed to demonstrate the real-time, security, and architectural capabilities of the ZCore backend directly inside the browser.

Through a sleek, responsive UI and an embedded **Live Inspector Dock**, users and developers can observe backend context hydration, dynamic field masking, correlation tracing, and real-time Server-Sent Events (SSE) in action.

---

## ✨ Key Frontend Features

### 1. 1-Click Persona Switcher (`PersonaSwitcher.tsx`)
Seamlessly switch between authorization personas directly from the navigation bar without re-logging in manually:
* **👑 SuperAdmin (`admin@zshop.io`):** Demonstrates superuser bypass of all RBAC scope checks.
* **👔 Store Manager (`manager@zshop.io`):** Demonstrates granular `HasScopes` authorization and full wholesale margin visibility.
* **👤 Customer (`john@example.com`):** Demonstrates automatic `Zchema` data pruning and customer order ownership scoping.
* **🚪 Guest (Public):** Demonstrates unauthenticated browsing and protected checkout routing.

---

### 2. ZCore Live Inspector Dock (`ZCoreDock.tsx`)
A developer console docked at the bottom of the screen with 4 dedicated inspection tabs:

* **🛡️ Context & Zchema (`ContextInspector.tsx`):**  
  Displays the live `ZContext` state currently hydrated on the backend, showing the active `user_id`, granted `scopes`, and the list of active `restricted_fields`.
* **📈 Request Tracker (`NetworkTracker.tsx`):**  
  Tracks outgoing HTTP requests, execution latency in milliseconds, status codes, and displays the **`x-request-id` (ZCore Correlation ID)** returned by the server middleware.
* **🧩 Dynamic Schema Viewer (`DynamicSchemaViewer.tsx`):**  
  Queries `GET /catalog/products/?schema=true` to inspect how the backend dynamically prunes the OpenAPI JSON schema on-the-fly according to the user's role.
* **📡 SSE Stream Monitor (`SSEMonitor.tsx`):**  
  Maintains a live stream log of Server-Sent Events (`ping`, `order.created`, `order.status_changed`, `system.announcement`) received from the server dispatcher.

---

### 3. Interactive Proof-of-Concept Components
* **Inspect Raw Payload Modal (`ProductCard.tsx`):**  
  Inspect the exact JSON received from the API to verify that sensitive fields (`cost_price`, `supplier_notes`) are completely omitted for Customers and present for Managers.
* **UnitOfWork Deficit Rollback Trigger (`CartDrawer.tsx`):**  
  A dedicated button in the checkout drawer that deliberately requests more stock than available to visually confirm an atomic 400 Bad Request rollback.
* **Declarative Scope Guarding (`ScopeGate.tsx`):**  
  Declaratively renders or hides buttons and views based on active permissions (e.g., hiding the Operations Dashboard from Customers).
* **Live SSE Toast Integration (`useSSE.ts`):**  
  Listens to SSE frames in the background and surfaces live toasts via Sonner whenever an order is confirmed or updated.

---

## 📁 Directory Structure

```
src/
├── components/
│   ├── common/              # Header, ThemeToggle, PersonaSwitcher, ScopeGate
│   ├── devtools/            # ZCoreDock, ContextInspector, NetworkTracker, SSEMonitor
│   └── ui/                  # Accessible primitives (Radix UI / Tailwind CSS)
├── features/
│   ├── catalog/             # CatalogView, ProductCard, Filter sidebar, Modals
│   ├── orders/              # CustomerOrdersView, CartDrawer, ManagerDashboard
│   └── realtime/            # Broadcast announcement modal & API
├── hooks/
│   ├── useDebounce.ts       # Debouncing for search & price range filters
│   └── useSSE.ts            # Persistent EventSource connection lifecycle
├── lib/
│   ├── api-client.ts        # Unified fetch wrapper with latency & x-request-id capture
│   ├── constants.ts         # Pre-configured seed personas metadata
│   └── utils.ts             # Tailwind class merging utility
├── stores/                  # State management via Zustand
│   ├── authStore.ts         # Persona switching, JWT tokens, /auth/me state
│   ├── cartStore.ts         # Shopping cart state with localStorage persistence
│   ├── devtoolsStore.ts     # DevTools open/closed state & request metrics
│   └── realtimeStore.ts     # SSE connection status & event logs
├── types/                   # TypeScript interfaces matching backend Zchemas
├── App.tsx                  # Routing & layout orchestration
└── main.tsx                 # Application DOM mounting point
```

---

## 🚦 Getting Started

### 1. Install Dependencies
Ensure Node.js 18+ is installed:

```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the root or set the backend API endpoint:

```env
VITE_API_URL=http://127.0.0.1:8000
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## 🛠️ Available Scripts

* **`npm run dev`**: Launches Vite development server with Hot Module Replacement (HMR).
* **`npm run build`**: Compiles TypeScript and builds production assets into `dist/`.
* **`npm run preview`**: Locally previews the production build.
* **`npm run lint`**: Runs ESLint checks across the codebase.

---

## 📜 License

Distributed under the **MIT License**. Developed by **[Baseryn](https://github.com/Baseryn)**.