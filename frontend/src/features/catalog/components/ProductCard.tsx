import { useState } from "react";
import { Product } from "@/types/catalog";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShoppingCart, Eye, Lock, ShieldCheck, Box } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { user } = useAuthStore();
  const [inspectOpen, setInspectOpen] = useState(false);

  const hasConfidentialData =
    product.cost_price !== undefined && product.cost_price !== null;

  const marginPercentage =
    hasConfidentialData && product.cost_price
      ? (((product.price - product.cost_price) / product.price) * 100).toFixed(1)
      : null;

  return (
    <Card className="flex flex-col justify-between border-border/70 bg-card/60 backdrop-blur-sm hover:border-brand-500/40 transition-all duration-200 overflow-hidden group">
      <div>
        <div className="relative aspect-video w-full bg-secondary/30 flex items-center justify-center border-b border-border/40 overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Box className="w-12 h-12 text-zinc-600" />
          )}

          <div className="absolute top-2 left-2 flex gap-1.5">
            <Badge variant="outline" className="font-mono text-[10px] bg-background/80 backdrop-blur-md">
              SKU: {product.sku}
            </Badge>
          </div>

          <div className="absolute top-2 right-2">
            <Badge
              variant={product.stock_quantity > 0 ? "outline" : "destructive"}
              className={`text-[10px] font-mono ${
                product.stock_quantity > 0
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : ""
              }`}
            >
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of Stock"}
            </Badge>
          </div>
        </div>

        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base tracking-tight text-foreground line-clamp-1">
              {product.name}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {product.description || "No description provided for this item."}
          </p>
        </CardHeader>

        <CardContent className="p-4 pt-1 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-mono text-muted-foreground uppercase">Price</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>

          {hasConfidentialData ? (
            <div className="p-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-amber-400">
                <span className="flex items-center gap-1 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Manager Wholesale View
                </span>
                <span className="text-[10px] bg-amber-500/20 px-1 rounded">
                  Margin: {marginPercentage}%
                </span>
              </div>
              <div className="flex justify-between text-zinc-300 text-[11px]">
                <span>Cost Price:</span>
                <span className="font-semibold text-amber-300">
                  ${Number(product.cost_price).toFixed(2)}
                </span>
              </div>
              {product.supplier_notes && (
                <div className="text-[10px] text-zinc-400 border-t border-amber-500/20 pt-1 line-clamp-1">
                  Note: {product.supplier_notes}
                </div>
              )}
            </div>
          ) : (
            <div className="p-2 rounded-md border border-dashed border-border/60 bg-secondary/20 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-zinc-500" />
                Confidential Margin
              </span>
              <span className="text-[10px] text-brand-500">Pruned via Zchema</span>
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
          <DialogTrigger>
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs font-mono gap-1 border-border">
              <Eye className="w-3.5 h-3.5 text-cyber-500" />
              <span>Inspect</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg font-mono text-xs">
            <DialogHeader>
              <DialogTitle className="text-sm font-mono flex items-center gap-2">
                <span>Zchema Raw Payload Inspection</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <div className="text-[11px] text-muted-foreground">
                Payload returned for: <span className="text-emerald-400 font-bold">{user ? user.email : "Guest"}</span>
              </div>
              <pre className="bg-zinc-950 p-3 rounded-lg border border-border/80 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed max-h-72">
                {JSON.stringify(product, null, 2)}
              </pre>
              <p className="text-[11px] text-muted-foreground font-sans">
                {hasConfidentialData
                  ? "Notice: 'cost_price' and 'supplier_notes' are present because your role grants access."
                  : "Notice: 'cost_price' and 'supplier_notes' are completely absent from this JSON payload, pruned at serialization level."}
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={() => onAddToCart && onAddToCart(product)}
          disabled={product.stock_quantity <= 0}
          size="sm"
          className="flex-1 h-8 text-xs gap-1.5 bg-brand-500 hover:bg-brand-600 text-zinc-950 font-semibold"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Add to Cart</span>
        </Button>
      </CardFooter>
    </Card>
  );
}