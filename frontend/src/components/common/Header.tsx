import { NavLink } from "react-router-dom";
import { PersonaSwitcher } from "./PersonaSwitcher";
import { ThemeToggle } from "./ThemeToggle";
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary transition-transform group-hover:scale-105">
              <Zap className="h-5 w-5 fill-primary/20" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">
              ZShop
            </span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1.5 text-sm">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors font-medium ${
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`
              }
            >
              <ShoppingBag className="w-4 h-4 text-primary" />
              Catalog
            </NavLink>

            <NavLink
              to="/my-orders"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors font-medium ${
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`
              }
            >
              <PackageCheck className="w-4 h-4 text-emerald-500" />
              My Orders
            </NavLink>

            <NavLink
              to="/operations"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg transition-colors font-medium ${
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`
              }
            >
              <Truck className="w-4 h-4 text-amber-500" />
              Operations
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border bg-secondary/50 text-xs">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
            <span className={isConnected ? "text-primary font-medium" : "text-muted-foreground"}>
              {status.toUpperCase()}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleCart}
            className="h-9 px-3.5 gap-2 rounded-lg relative"
          >
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <Badge className="h-5 px-1.5 text-xs bg-primary text-primary-foreground font-bold ml-1">
                {count}
              </Badge>
            )}
          </Button>

          <PersonaSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}