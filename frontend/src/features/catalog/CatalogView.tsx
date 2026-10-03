import { useState, useEffect, useCallback } from "react";
import { Product, Category, SearchFilter } from "@/types/catalog";
import { catalogApi } from "./api";
import { ProductCard } from "./components/ProductCard";
import { CatalogFilters } from "./components/CatalogFilters";
import { useAuthStore } from "@/stores/authStore";
import { ScopeGate } from "@/components/common/ScopeGate";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, RefreshCw, Lock, ShieldAlert } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useDebounce } from "@/hooks/useDebounce";

export function CatalogView() {
  const { activePersona, user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addItem } = useCartStore();

  const debouncedPriceRange = useDebounce(priceRange, 1000);
  const debouncedSearchQuery = useDebounce(searchQuery, 800);

  const isAuthorized = Boolean(
    user?.is_superuser || user?.scopes?.includes("products:listview")
  );

  useEffect(() => {
    if (isAuthorized) {
      catalogApi
        .getCategories()
        .then((cats) => setCategories(Array.isArray(cats) ? cats : []))
        .catch(console.error);
    }
  }, [isAuthorized]);

  const loadProducts = useCallback(async () => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const filters: SearchFilter[] = [];

    if (debouncedSearchQuery.trim()) {
      filters.push({ field: "name", op: "ilike", value: `%${debouncedSearchQuery.trim()}%` });
    }

    if (debouncedPriceRange[0] > 0 || debouncedPriceRange[1] < 500) {
      filters.push({
        field: "price",
        op: "between",
        value: [debouncedPriceRange[0], debouncedPriceRange[1]],
      });
    }

    if (selectedCategory) {
      filters.push({ field: "category_id", op: "eq", value: selectedCategory });
    }

    try {
      const res = await catalogApi.searchProducts({
        filters,
        size: 12,
      });
      setProducts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, debouncedPriceRange, selectedCategory, isAuthorized]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, activePersona]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setPriceRange([0, 500]);
    setSelectedCategory(null);
  };

  return (
    <ScopeGate
      scope="products:listview"
      fallback={
        <Card className="border-destructive/30 bg-destructive/5 text-center p-16 space-y-5 rounded-2xl shadow-sm max-w-2xl mx-auto my-12">
          <div className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-xl text-destructive font-bold flex items-center justify-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>403 Forbidden — Scope Required</span>
            </CardTitle>
            <CardDescription className="text-sm max-w-md mx-auto leading-relaxed text-muted-foreground">
              Accessing the full product catalog and advanced search requires the{" "}
              <span className="font-mono text-foreground font-semibold">products:listview</span>{" "}
              permission scope.
            </CardDescription>
          </div>
        </Card>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="p-5 rounded-2xl border bg-card/60 backdrop-blur-md sticky top-24 shadow-sm">
            <CatalogFilters
              categories={categories}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              onReset={handleResetFilters}
            />
          </div>
        </div>

        <div className="md:col-span-3 space-y-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b font-medium">
            <span>SHOWING {products.length} PRODUCTS</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadProducts}
              disabled={loading}
              className="h-8 text-xs gap-1.5 hover:text-primary rounded-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              Refresh Catalog
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3 p-5 rounded-2xl border bg-card shadow-sm">
                  <Skeleton className="aspect-video w-full rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full mt-4 rounded-lg" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 text-center border border-dashed rounded-2xl space-y-3 bg-card/40">
              <Package className="w-12 h-12 text-muted-foreground mx-auto" />
              <div className="text-base font-semibold text-foreground">No products found</div>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                No products match your active search filters, or no products have been seeded into the database yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={(prod) => addItem(prod, 1)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ScopeGate>
  );
}