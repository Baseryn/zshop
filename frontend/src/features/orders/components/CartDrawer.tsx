import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { ordersApi } from "../api";
import { OrderResponse } from "@/types/orders";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Package,
} from "lucide-react";

export function CartDrawer() {
  const { items, isOpen, setOpen, removeItem, updateQuantity, clearCart, totalPrice } =
    useCartStore();
  const { user } = useAuthStore();

  const [address, setAddress] = useState("100 Innovation Boulevard, Tech Park");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<OrderResponse | null>(null);

  const handleCheckout = async (simulateDeficit = false) => {
    if (!user) {
      setErrorMsg("Please switch to an authenticated persona (e.g. Customer) to place orders.");
      return;
    }

    if (items.length === 0) return;

    setSubmitting(true);
    setErrorMsg(null);

    const orderPayload = {
      shipping_address: address,
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: simulateDeficit ? item.stock_quantity + 50 : item.quantity,
      })),
    };

    try {
      const order = await ordersApi.placeOrder(orderPayload);
      setLastPlacedOrder(order);
      clearCart();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process order transaction");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-6">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-lg font-bold flex items-center justify-between">
            <span className="flex items-center gap-2.5">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Shopping Cart
            </span>
            <Badge variant="secondary" className="text-xs rounded-full">
              {items.length} items
            </Badge>
          </SheetTitle>
        </SheetHeader>

        {lastPlacedOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-5 p-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-foreground">Order Placed Successfully!</h4>
              <p className="text-xs text-muted-foreground">
                Atomic UnitOfWork committed your transaction and decremented stock.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-xl text-xs text-left w-full space-y-1.5 font-mono">
              <div>Order ID: <span className="text-primary font-bold">{lastPlacedOrder.id.slice(0, 8)}...</span></div>
              <div>Status: <span className="text-emerald-500 font-bold uppercase">{lastPlacedOrder.status}</span></div>
              <div>Total: <span className="text-primary font-bold">${Number(lastPlacedOrder.total_amount).toFixed(2)}</span></div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLastPlacedOrder(null);
                setOpen(false);
              }}
              className="w-full text-xs rounded-lg"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              {items.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground space-y-3">
                  <Package className="w-10 h-10 mx-auto text-muted-foreground/60" />
                  <p className="text-sm">Your cart is empty.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.product_id} className="py-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-sm truncate">
                          {item.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-2.5 mt-0.5">
                          <span className="font-mono">SKU: {item.sku}</span>
                          <span className="text-primary font-semibold font-mono">${item.price.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="h-7 w-7 rounded-md"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="w-6 text-center text-xs font-bold font-mono">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="h-7 w-7 rounded-md"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeItem(item.product_id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-md ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {items.length > 0 && (
              <SheetFooter className="border-t pt-4 flex flex-col gap-3">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Transaction Aborted (400)</div>
                      <div className="text-[11px] opacity-90">{errorMsg}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 w-full">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Shipping Address</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter shipping address..."
                    className="h-9 text-xs rounded-lg"
                  />
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-muted-foreground text-xs uppercase font-medium">Subtotal</span>
                  <span className="text-xl font-bold text-primary font-mono">
                    ${totalPrice().toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2 w-full pt-1">
                  <Button
                    onClick={() => handleCheckout(false)}
                    disabled={submitting || items.length === 0}
                    className="w-full h-10 rounded-lg font-semibold gap-2 shadow-sm"
                  >
                    {!user && <Lock className="w-4 h-4" />}
                    <span>{submitting ? "Committing Transaction..." : "Place Order (Atomic Commit)"}</span>
                  </Button>

                  <Button
                    onClick={() => handleCheckout(true)}
                    disabled={submitting || items.length === 0}
                    variant="outline"
                    className="w-full h-9 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 gap-2 rounded-lg"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    <span>Test UoW Deficit Rollback</span>
                  </Button>
                </div>
              </SheetFooter>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}