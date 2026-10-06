import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useSSE } from "@/hooks/useSSE";
import { Header } from "@/components/common/Header";
import { ZCoreDock } from "@/components/devtools/ZCoreDock";
import { CatalogView } from "@/features/catalog/CatalogView";
import { ProductDetailView } from "@/features/catalog/ProductDetailView";
import { CustomerOrdersView } from "@/features/orders/CustomerOrdersView";
import { ManagerDashboard } from "@/features/orders/components/ManagerDashboard";
import { CartDrawer } from "@/features/orders/components/CartDrawer";
import { Toaster } from "@/components/ui/sonner";

function AppLayout() {
  const { fetchMe } = useAuthStore();
  useSSE();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-20">
      <Header />

      <main className="container max-w-screen-2xl flex-1 py-8 px-4 sm:px-8">
        <Routes>
          <Route path="/" element={<CatalogView />} />
          <Route path="/product/:id" element={<ProductDetailView />} />
          <Route path="/my-orders" element={<CustomerOrdersView />} />
          <Route path="/operations" element={<ManagerDashboard />} />
        </Routes>
      </main>

      <CartDrawer />
      <ZCoreDock />
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}