import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [inspectOpen, setInspectOpen] = useState(false);

  const hasConfidentialData =
    product.cost_price !== undefined && product.cost_price !== null;

  const marginPercentage =
    hasConfidentialData && product.cost_price
      ? (((product.price - product.cost_price) / product.price) * 100).toFixed(1)
      : null;

  return (
    <Card className="flex flex-col justify-between rounded-2xl overflow-hidden hover:shadow-md transition-all group">
      <div>
        <div
          onClick={() => navigate(`/product/${product.id}`)}
          className="relative aspect-video w-full bg-secondary/40 flex items-center justify-center border-b overflow-hidden cursor-pointer"
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Box className="w-12 h-12 text-muted-foreground/60" />
          )}

          <div className="absolute top-2.5 left-2.5">
            <Badge variant="secondary" className="font-mono text-[10px] rounded-full shadow-sm">
              SKU: {product.sku}
            </Badge>
          </div>

          <div className="absolute top-2.5 right-2.5">
            <Badge
              variant={product.stock_quantity > 0 ? "secondary" : "destructive"}
              className={`text-[10px] rounded-full ${
                product.stock_quantity > 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : ""
              }`}
            >
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of Stock"}
            </Badge>
          </div>
        </div>

        <CardHeader className="p-5 pb-2">
          <h3
            onClick={() => navigate(`/product/${product.id}`)}
            className="font-semibold text-base tracking-tight text-foreground line-clamp-1 cursor-pointer hover:text-primary transition-colors"
          >
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {product.description || "No description provided for this item."}
          </p>
        </CardHeader>

        <CardContent className="p-5 pt-1 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground uppercase font-medium">Price</span>
            <span className="text-xl font-bold font-mono text-primary">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>

          {hasConfidentialData ? (
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Wholesale Margin
                </span>
                <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-full">
                  {marginPercentage}%
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Cost Price:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-300 font-mono">
                  ${Number(product.cost_price).toFixed(2)}
                </span>
              </div>
              {product.supplier_notes && (
                <div className="text-[11px] text-muted-foreground border-t border-amber-500/20 pt-1 line-clamp-1">
                  Note: {product.supplier_notes}
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl border border-dashed bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                Confidential Margin
              </span>
              <span className="text-primary text-xs font-medium">Pruned via Zchema</span>
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="p-5 pt-0 flex gap-2">
        <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-3 text-xs gap-1.5 rounded-lg">
              <Eye className="w-4 h-4 text-primary" />
              <span>Inspect</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <span>Zchema Raw Payload Inspection</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Payload returned for: <span className="text-primary font-bold">{user ? user.email : "Guest"}</span>
              </div>
              <pre className="bg-muted p-4 rounded-xl border font-mono text-xs leading-relaxed max-h-72 overflow-x-auto text-foreground">
                {JSON.stringify(product, null, 2)}
              </pre>
              <p className="text-xs text-muted-foreground">
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
          className="flex-1 h-9 text-xs gap-1.5 rounded-lg shadow-sm"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </Button>
      </CardFooter>
    </Card>
  );
}