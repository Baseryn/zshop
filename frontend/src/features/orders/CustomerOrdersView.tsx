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
      .getMyOrders()
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
      <div className="p-16 text-center border border-dashed rounded-2xl space-y-4 text-sm bg-card/40">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
        <div className="text-base font-semibold text-foreground">Authentication Required</div>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Please select an authenticated persona (e.g. Customer) from the top header to view order history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Package className="w-6 h-6 text-primary" />
            My Order History
          </h2>
          <p className="text-muted-foreground text-xs mt-1">
            Scoped strictly to context user ID: <span className="text-primary font-mono font-medium">{user.id}</span>
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
          className="h-9 text-xs gap-1.5 rounded-lg"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>Reload</span>
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground text-sm animate-pulse">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center border border-dashed rounded-2xl space-y-3 bg-card/40">
          <Package className="w-10 h-10 text-muted-foreground mx-auto" />
          <div className="text-foreground font-semibold">No orders recorded for this account</div>
          <Button size="sm" onClick={() => navigate("/")} className="h-9 text-xs rounded-lg mt-2">
            Explore Catalog
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="p-5 border-b bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base font-bold text-foreground">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="text-xs uppercase rounded-full"
                    >
                      {order.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-muted-foreground text-xs">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                    <span className="text-primary font-bold text-base font-mono">
                      ${Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>Shipping Address: {order.shipping_address}</span>
                </div>

                {order.tracking_code && (
                  <div className="text-xs text-primary bg-primary/10 p-3 rounded-xl border border-primary/20 font-mono">
                    Tracking Code: {order.tracking_code}
                  </div>
                )}

                <div className="border-t pt-3 space-y-2">
                  <div className="text-xs text-muted-foreground font-semibold uppercase">Purchased Items</div>
                  <div className="divide-y">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2 flex justify-between items-center text-xs">
                        <span className="text-foreground font-medium">Product ID: {item.product_id.slice(0, 8)}...</span>
                        <div className="flex gap-4 text-muted-foreground">
                          <span>Qty: {item.quantity}</span>
                          <span className="text-primary font-semibold font-mono">${Number(item.subtotal).toFixed(2)}</span>
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