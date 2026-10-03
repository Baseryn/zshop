import { NavLink } from "react-router-dom";
import { PersonaSwitcher } from "./PersonaSwitcher";
import { useCartStore } from "@/stores/cartStore";
import { useRealtimeStore } from "@/stores/realtimeStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ShoppingCart, Radio, ShoppingBag, Truck, PackageCheck } from "lucide-react";

export function Header() {
  const { toggleCart, totalItems } = useCartStore();
  const { status } = useRealtimeStore();
  const count = totalItems();
  const isConnected = status === "connected";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-500">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              ZShop
            </span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1 text-xs">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <ShoppingBag className="w-3.5 h-3.5 text-brand-500" />
              Catalog
            </NavLink>

            <NavLink
              to="/my-orders"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <PackageCheck className="w-3.5 h-3.5 text-cyber-500" />
              My Orders
            </NavLink>

            <NavLink
              to="/operations"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              Operations
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-border/60 bg-secondary/30 text-[10px]">
            <Radio className={`w-3 h-3 ${isConnected ? "text-emerald-400 animate-pulse" : "text-zinc-500"}`} />
            <span className={isConnected ? "text-emerald-400 font-semibold" : "text-muted-foreground"}>
              {status.toUpperCase()}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleCart}
            className="h-9 px-3 gap-2 border-border/80 bg-card/60 text-xs relative"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-brand-500" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <Badge className="h-5 px-1.5 text-[10px] bg-brand-500 text-zinc-950 font-bold ml-1">
                {count}
              </Badge>
            )}
          </Button>

          <PersonaSwitcher />
        </div>
      </div>
    </header>
  );
}