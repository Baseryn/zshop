import { useEffect, useState } from "react";
import { OrderResponse } from "@/types/orders";
import { ordersApi } from "./api";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, RefreshCw, Clock, MapPin, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CustomerOrdersView() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    ordersApi
      .getOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-12 text-center border border-dashed border-border/60 rounded-xl space-y-4 font-mono text-xs">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
        <div className="text-sm font-semibold text-foreground">Authentication Required</div>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Please select an authenticated persona (e.g. Customer) from the top header to view order history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-500" />
            My Order History
          </h2>
          <p className="text-muted-foreground text-[11px] mt-1">
            Scoped strictly to context user ID: <span className="text-brand-500">{user.id}</span>
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          className="h-8 text-xs gap-1.5 border-border"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-500" : ""}`} />
          <span>Reload</span>
        </Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground animate-pulse">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border/60 rounded-xl space-y-3">
          <Package className="w-8 h-8 text-zinc-600 mx-auto" />
          <div className="text-foreground font-semibold">No orders recorded for this account</div>
          <Button size="sm" onClick={() => navigate("/")} className="h-8 text-xs bg-brand-500 text-zinc-950 font-bold">
            Explore Catalog
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="border-border/60 bg-card/40 backdrop-blur-md">
              <CardHeader className="p-4 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-foreground">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase ${
                        order.status === "shipped"
                          ? "bg-cyber-500/10 text-cyber-500 border-cyber-500/30"
                          : order.status === "delivered"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : "bg-secondary/40 text-muted-foreground"
                      }`}
                    >
                      {order.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                    <span className="text-emerald-400 font-bold text-sm">
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Shipping Address: {order.shipping_address}</span>
                </div>

                {order.tracking_code && (
                  <div className="text-[11px] text-cyber-500 bg-cyber-500/10 p-2 rounded border border-cyber-500/20">
                    Tracking Code: {order.tracking_code}
                  </div>
                )}

                <div className="border-t border-border/30 pt-2 space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase">Purchased Items:</div>
                  <div className="divide-y divide-border/20">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-1.5 flex justify-between items-center text-[11px]">
                        <span className="text-foreground">Product ID: {item.product_id.slice(0, 8)}...</span>
                        <div className="flex gap-3 text-muted-foreground">
                          <span>Qty: {item.quantity}</span>
                          <span className="text-emerald-400 font-semibold">${Number(item.subtotal).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}