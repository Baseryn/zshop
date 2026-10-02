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
      <SheetContent className="flex flex-col w-full sm:max-w-md p-6 font-mono text-xs">
        <SheetHeader className="pb-4 border-b border-border/50">
          <SheetTitle className="text-base font-mono flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-500" />
              Shopping Cart
            </span>
            <Badge variant="outline" className="text-[10px]">
              {items.length} items
            </Badge>
          </SheetTitle>
        </SheetHeader>

        {lastPlacedOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">Order Placed Successfully!</h4>
              <p className="text-xs text-muted-foreground font-sans">
                Atomic UnitOfWork committed your transaction and decremented stock.
              </p>
            </div>
            <div className="p-3 bg-secondary/40 rounded-lg text-[11px] border border-border/60 text-left w-full space-y-1">
              <div>Order ID: <span className="text-brand-500 font-bold">{lastPlacedOrder.id.slice(0, 8)}...</span></div>
              <div>Status: <span className="text-emerald-400 font-bold">{lastPlacedOrder.status}</span></div>
              <div>Total: <span className="text-emerald-400 font-bold">${Number(lastPlacedOrder.total_amount).toFixed(2)}</span></div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLastPlacedOrder(null);
                setOpen(false);
              }}
              className="w-full text-xs"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              {items.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-2">
                  <Package className="w-8 h-8 mx-auto text-zinc-600" />
                  <p>Your cart is empty.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {items.map((item) => (
                    <div key={item.product_id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-xs truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex gap-2">
                          <span>SKU: {item.sku}</span>
                          <span className="text-emerald-400 font-semibold">${item.price.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="h-6 w-6"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="h-6 w-6"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.product_id)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {items.length > 0 && (
              <SheetFooter className="border-t border-border/50 pt-4 flex flex-col gap-3">
                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-red-400 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Transaction Aborted (400)</div>
                      <div className="text-[10px] opacity-90">{errorMsg}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 w-full">
                  <label className="text-[10px] text-muted-foreground uppercase">Shipping Address</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter shipping address..."
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-muted-foreground text-xs uppercase">Subtotal</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    ${totalPrice().toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2 w-full pt-1">
                  <Button
                    onClick={() => handleCheckout(false)}
                    disabled={submitting || items.length === 0}
                    className="w-full h-9 bg-brand-500 hover:bg-brand-600 text-zinc-950 font-semibold gap-2"
                  >
                    {!user && <Lock className="w-3.5 h-3.5" />}
                    <span>{submitting ? "Committing Transaction..." : "Place Order (Atomic Commit)"}</span>
                  </Button>

                  <Button
                    onClick={() => handleCheckout(true)}
                    disabled={submitting || items.length === 0}
                    variant="outline"
                    className="w-full h-8 text-[11px] border-destructive/40 text-red-400 hover:bg-destructive/10 gap-1.5"
                  >
                    <AlertTriangle className="w-3 h-3 text-red-400" />
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