import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useSSE } from "@/hooks/useSSE";
import { Header } from "@/components/common/Header";
import { ZCoreDock } from "@/components/devtools/ZCoreDock";
import { CatalogView } from "@/features/catalog/CatalogView";
import { ManagerDashboard } from "@/features/orders/components/ManagerDashboard";
import { CartDrawer } from "@/features/orders/components/CartDrawer";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Truck } from "lucide-react";

export default function App() {
  const { fetchMe } = useAuthStore();
  const [activeView, setActiveView] = useState<"catalog" | "operations">("catalog");

  useSSE();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    fetchMe();
  }, [fetchMe]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-16">
      <Header />

      <main className="container max-w-screen-2xl flex-1 py-8 px-4 sm:px-8 space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <Tabs
            value={activeView}
            onValueChange={(v) => setActiveView(v as "catalog" | "operations")}
          >
            <TabsList className="bg-secondary/40 border border-border/50 h-9 font-mono">
              <TabsTrigger value="catalog" className="text-xs gap-1.5 h-7">
                <ShoppingBag className="w-3.5 h-3.5 text-brand-500" />
                Storefront Catalog
              </TabsTrigger>
              <TabsTrigger value="operations" className="text-xs gap-1.5 h-7">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                Manager Operations
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <span className="text-[11px] font-mono text-muted-foreground hidden sm:block">
            Decoupled Modular Architecture
          </span>
        </div>

        {activeView === "catalog" ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  Product Catalog
                </h1>
                <span className="text-xs font-mono text-brand-500 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full">
                  Zchema Enabled
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Experience automatic sensitive data pruning, keyset pagination, and atomic transactions.
              </p>
            </div>
            <CatalogView />
          </div>
        ) : (
          <ManagerDashboard />
        )}
      </main>

      <CartDrawer />

      <ZCoreDock />

      <Toaster position="top-right" richColors />
    </div>
  );
}