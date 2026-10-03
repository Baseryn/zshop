import { useState, useEffect, useCallback } from "react";
import { OrderResponse, OrderStatus } from "@/types/orders";
import { Category, Product } from "@/types/catalog";
import { ordersApi } from "../api";
import { catalogApi } from "@/features/catalog/api";
import { useAuthStore } from "@/stores/authStore";
import { ScopeGate } from "@/components/common/ScopeGate";
import { BroadcastModal } from "@/features/realtime/components/BroadcastModal";
import { CreateProductModal } from "@/features/catalog/components/CreateProductModal";
import { CreateCategoryModal } from "@/features/catalog/components/CreateCategoryModal";
import { ProductManagementTable } from "@/features/catalog/components/ProductManagementTable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RefreshCw, ShoppingBag, Lock, Truck, Package, FolderTree, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export function ManagerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isAuthorizedManager = Boolean(
    user?.is_superuser || user?.is_staff || user?.scopes?.includes("orders:update")
  );

  const loadData = useCallback(async () => {
    if (!isAuthorizedManager) return;

    setLoading(true);
    try {
      const [ordersData, categoriesData, productsData] = await Promise.all([
        ordersApi.getOrders().catch(() => []),
        catalogApi.getCategories().catch(() => []),
        catalogApi.searchProducts({ size: 100 }).catch(() => []),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthorizedManager]);

  useEffect(() => {
    if (isAuthorizedManager) {
      loadData();
    } else {
      setOrders([]);
      setProducts([]);
      setCategories([]);
    }
  }, [isAuthorizedManager, loadData]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const updated = await ordersApi.updateOrderStatus(orderId, newStatus, "TRACK-ZSHOP-2026");
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      toast.success("Order Transitioned", {
        description: `Order #${orderId.slice(0, 8)} status set to '${newStatus}'.`,
      });
    } catch (err: any) {
      toast.error("Permission Denied", {
        description: err.message || "Failed to transition status.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const safeOrders = orders || [];
  const safeProducts = products || [];
  const safeCategories = categories || [];

  return (
    <ScopeGate
      scope="orders:update"
      fallback={
        <Card className="border-destructive/30 bg-destructive/5 text-center p-16 space-y-5 rounded-2xl shadow-sm max-w-2xl mx-auto my-12">
          <div className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-xl text-destructive font-bold flex items-center justify-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>403 Forbidden — Restricted Area</span>
            </CardTitle>
            <CardDescription className="text-sm max-w-md mx-auto leading-relaxed text-muted-foreground">
              This operations hub is exclusively reserved for staff and managers.
              Customer accounts do not have permission to view or manage store operations.
            </CardDescription>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="rounded-lg text-xs">
              Return to Catalog
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate("/my-orders")} className="rounded-lg text-xs">
              View My Orders
            </Button>
          </div>
        </Card>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <Truck className="w-6 h-6 text-amber-500" />
                Store Operations & Admin Hub
              </h2>
              <Badge variant="secondary" className="text-xs rounded-full border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-mono">
                RBAC PROTECTED
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Manage orders, real-time inventory, categories, and system-wide broadcasts with ZCore RBAC.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <CreateCategoryModal onCategoryCreated={loadData} />
            <CreateProductModal categories={safeCategories} onProductCreated={loadData} />
            <BroadcastModal />

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-9 text-xs gap-1.5 rounded-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              <span>Reload</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="h-10 p-1 rounded-xl">
            <TabsTrigger value="orders" className="text-xs gap-2 rounded-lg">
              <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              <span>Orders Registry ({safeOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs gap-2 rounded-lg">
              <Package className="w-3.5 h-3.5 text-emerald-500" />
              <span>Catalog & Stock ({safeProducts.length})</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs gap-2 rounded-lg">
              <FolderTree className="w-3.5 h-3.5 text-amber-500" />
              <span>Categories ({safeCategories.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-0">
            <Card className="rounded-2xl shadow-sm overflow-hidden border">
              <CardHeader className="p-5 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground text-sm">Customer Orders Fulfillment</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Scope: orders:view & orders:update</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {safeOrders.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-xs">
                    No orders placed yet. Place an order from the catalog first.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs uppercase font-semibold">Order ID</TableHead>
                        <TableHead className="text-xs uppercase font-semibold">Customer / User ID</TableHead>
                        <TableHead className="text-xs uppercase font-semibold">Total</TableHead>
                        <TableHead className="text-xs uppercase font-semibold">Status</TableHead>
                        <TableHead className="text-xs uppercase font-semibold">Transition State</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeOrders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-bold text-foreground font-mono">
                            #{o.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs font-mono">
                            {o.user_id.slice(0, 13)}...
                          </TableCell>
                          <TableCell className="text-primary font-semibold font-mono">
                            ${Number(o.total_amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="text-xs uppercase rounded-full"
                            >
                              {o.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              disabled={updatingId === o.id}
                              value={o.status}
                              onValueChange={(val) => handleStatusChange(o.id, val as OrderStatus)}
                            >
                              <SelectTrigger className="h-8 w-36 text-xs rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt} value={opt} className="text-xs uppercase rounded-md">
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-0">
            <ProductManagementTable products={safeProducts} categories={safeCategories} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <Card className="rounded-2xl shadow-sm overflow-hidden border">
              <CardHeader className="p-5 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FolderTree className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold text-foreground text-sm">Classification Categories</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Scope: categories:create & categories:view</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {safeCategories.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-xs">
                    No categories found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs uppercase font-semibold">Category Name</TableHead>
                        <TableHead className="text-xs uppercase font-semibold">URL Slug</TableHead>
                        <TableHead className="text-xs uppercase font-semibold">Description</TableHead>
                        <TableHead className="text-xs uppercase font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeCategories.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-semibold text-foreground text-xs">{c.name}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{c.slug}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.description || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs rounded-full">
                              Active
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScopeGate>
  );
}