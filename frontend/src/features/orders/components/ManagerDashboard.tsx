import { useState, useEffect } from "react";
import { OrderResponse, OrderStatus } from "@/types/orders";
import { ordersApi } from "../api";
import { useAuthStore } from "@/stores/authStore";
import { ScopeGate } from "@/components/common/ScopeGate";
import { BroadcastModal } from "@/features/realtime/components/BroadcastModal";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RefreshCw, ShoppingBag, Lock, Truck } from "lucide-react";
import { toast } from "sonner";

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
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getOrders();
      setOrders(data);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_superuser || user?.scopes.includes("orders:view")) {
      fetchOrders();
    }
  }, [user]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-mono tracking-tight text-foreground flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              Store Operations Dashboard
            </h2>
            <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-400 bg-amber-500/10">
              RBAC PROTECTED
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Fulfillment state transitions trigger decoupled domain events and broadcast to SSE streams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <BroadcastModal />

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="h-8 text-xs font-mono gap-1 border-border"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-500" : ""}`} />
            <span>Reload</span>
          </Button>
        </div>
      </div>

      <ScopeGate
        scope="orders:view"
        fallback={
          <Card className="border-destructive/30 bg-destructive/5 text-center p-8 space-y-3 font-mono">
            <div className="w-10 h-10 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm text-destructive">403 Forbidden - Scope Required</CardTitle>
            <CardDescription className="text-xs max-w-md mx-auto">
              Your active persona lacks the <span className="text-foreground font-bold font-mono">'orders:view'</span> scope.
              Switch to <span className="text-amber-400 font-bold">StoreManager</span> or <span className="text-red-400 font-bold">SuperAdmin</span> via the Persona Switcher in the top header.
            </CardDescription>
          </Card>
        }
      >
        <Card className="border-border/60 bg-card/40 backdrop-blur-md overflow-hidden font-mono text-xs">
          <CardHeader className="p-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-cyber-500" />
                <span className="font-semibold text-foreground text-xs">Orders Registry ({orders.length})</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Scope: orders:view & orders:update</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs font-sans">
                No orders placed yet. Place an order from the catalog first.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase">Order ID</TableHead>
                    <TableHead className="text-[10px] uppercase">Customer / User ID</TableHead>
                    <TableHead className="text-[10px] uppercase">Total</TableHead>
                    <TableHead className="text-[10px] uppercase">Status</TableHead>
                    <TableHead className="text-[10px] uppercase">Transition State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow key={o.id} className="border-border/30 hover:bg-secondary/20">
                      <TableCell className="font-bold text-foreground">
                        #{o.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[10px]">
                        {o.user_id.slice(0, 13)}...
                      </TableCell>
                      <TableCell className="text-emerald-400 font-semibold">
                        ${Number(o.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase ${
                            o.status === "shipped"
                              ? "bg-cyber-500/10 text-cyber-500 border-cyber-500/30"
                              : o.status === "delivered"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-secondary/40 text-muted-foreground"
                          }`}
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
                          <SelectTrigger className="h-7 w-32 text-[10px] font-mono bg-zinc-950/60 border-border/60">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="font-mono text-xs">
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt} className="text-[11px] uppercase">
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
      </ScopeGate>
    </div>
  );
}