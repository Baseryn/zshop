import { PersonaSwitcher } from "./PersonaSwitcher";
import { useCartStore } from "@/stores/cartStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, ShoppingCart } from "lucide-react";

export function Header() {
  const { toggleCart, totalItems } = useCartStore();
  const count = totalItems();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-500">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground font-mono">
              ZShop
            </span>
          </div>

          <Badge variant="outline" className="text-[10px] font-mono bg-secondary/50 text-muted-foreground border-border">
            ZCore v0.1.0-rc.2
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCart}
            className="h-9 px-3 gap-2 border-border/80 bg-card/60 font-mono text-xs relative"
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