import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Header } from "@/components/common/Header";
import { ZCoreDock } from "@/components/devtools/ZCoreDock";
import { CatalogView } from "@/features/catalog/CatalogView";
import { CartDrawer } from "@/features/orders/components/CartDrawer";

export default function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    fetchMe();
  }, [fetchMe]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-16">
      <Header />

      <main className="container max-w-screen-2xl flex-1 py-8 px-4 sm:px-8 space-y-8">
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
      </main>

      <CartDrawer />

      <ZCoreDock />
    </div>
  );
}