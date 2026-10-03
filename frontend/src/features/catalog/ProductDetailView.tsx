import { useEffect, useState, useRef, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Product } from "@/types/catalog";
import { catalogApi } from "./api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Box, ShoppingCart, Lock, ShieldCheck, Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

export function ProductDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    catalogApi
      .getProductById(id)
      .then(setProduct)
      .catch((err) => {
        toast.error("Failed to load product", { description: err.message });
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const updatedProduct = await apiClient<Product>(`/catalog/products/${id}/image`, {
        method: "POST",
        body: formData,
      });
      setProduct(updatedProduct);
      toast.success("Image Uploaded", { description: "Validated via Magic-Bytes and linked successfully." });
    } catch (err: any) {
      toast.error("Upload Rejected", { description: err.message || "Failed byte-level security inspection" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-12 text-center border border-dashed border-border/60 rounded-xl space-y-4">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
        <div className="text-sm font-semibold">Product not found</div>
        <Button variant="outline" size="sm" onClick={() => navigate("/")} className="text-xs">
          Return to Catalog
        </Button>
      </div>
    );
  }

  const hasConfidentialData = product.cost_price !== undefined && product.cost_price !== null;
  const canUploadImage = Boolean(user?.is_superuser || user?.scopes.includes("products:update"));

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/")}
        className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Catalog
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-secondary/20 rounded-xl border border-border/60 flex items-center justify-center overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Box className="w-20 h-20 text-zinc-600" />
            )}

            <div className="absolute top-3 left-3">
              <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-md">
                SKU: {product.sku}
              </Badge>
            </div>
          </div>

          {canUploadImage && (
            <Card className="border-border/60 bg-card/40 p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Admin Asset Management</span>
                <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                  products:update
                </Badge>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-8 text-xs gap-2 border-dashed border-border/80 hover:border-brand-500"
              >
                <Upload className="w-3.5 h-3.5 text-brand-500" />
                <span>{uploading ? "Inspecting & Uploading..." : "Upload New Image (Magic-Bytes Validated)"}</span>
              </Button>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={product.stock_quantity > 0 ? "outline" : "destructive"}
                className={`text-xs ${
                  product.stock_quantity > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : ""
                }`}
              >
                {product.stock_quantity > 0 ? `${product.stock_quantity} units available` : "Out of Stock"}
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Slug: {product.slug}
              </Badge>
            </div>
          </div>

          <div className="border-y border-border/50 py-4 flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground uppercase">Retail Price</span>
            <span className="text-3xl font-bold text-emerald-400">${Number(product.price).toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Product Description</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {product.description || "No descriptive information provided for this product entry."}
            </p>
          </div>

          {hasConfidentialData ? (
            <Card className="border-amber-500/30 bg-amber-500/10 text-xs">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between text-amber-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Manager Wholesale Margin
                  </span>
                  <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-300">
                    PROTECTED
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2">
                <div className="flex justify-between text-zinc-300">
                  <span>Unit Cost Price:</span>
                  <span className="font-bold text-amber-300">${Number(product.cost_price).toFixed(2)}</span>
                </div>
                {product.supplier_notes && (
                  <div className="border-t border-amber-500/20 pt-2 text-zinc-400 text-[11px]">
                    Internal Note: {product.supplier_notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="p-3 rounded-lg border border-dashed border-border/60 bg-secondary/10 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-zinc-500" />
                Confidential Margin
              </span>
              <span className="text-brand-500 text-[11px]">Pruned via Zchema</span>
            </div>
          )}

          <Button
            onClick={() => addItem(product, 1)}
            disabled={product.stock_quantity <= 0}
            className="w-full h-10 text-xs font-semibold gap-2 bg-brand-500 hover:bg-brand-600 text-zinc-950"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </Button>
        </div>
      </div>
    </div>
  );
}