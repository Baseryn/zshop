import { useEffect, useState, useRef, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Product } from "@/types/catalog";
import { catalogApi } from "./api";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { getImageUrl } from "@/lib/api-client";
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
        <Skeleton className="h-8 w-32 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-5 w-1/4 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-16 text-center border border-dashed rounded-2xl space-y-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
        <div className="text-base font-semibold">Product not found</div>
        <Button variant="outline" size="sm" onClick={() => navigate("/")} className="text-xs rounded-lg">
          Return to Catalog
        </Button>
      </div>
    );
  }

  const isManager = Boolean(user?.is_superuser || user?.scopes.includes("products:update"));
  const hasConfidentialData = isManager && product.cost_price !== undefined && product.cost_price !== null;
  const canUploadImage = isManager;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/")}
        className="h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground rounded-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative aspect-square w-full bg-secondary/30 rounded-2xl border flex items-center justify-center overflow-hidden">
            {product.image_url ? (
              <img src={getImageUrl(product.image_url)} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <Box className="w-20 h-20 text-muted-foreground/60" />
            )}

            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="font-mono text-xs rounded-full shadow-sm">
                SKU: {product.sku}
              </Badge>
            </div>
          </div>

          {canUploadImage && (
            <Card className="rounded-2xl p-4 text-xs space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Asset Management</span>
                <Badge variant="secondary" className="text-[10px] text-amber-500 font-mono rounded-full">
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
                className="w-full h-9 text-xs gap-2 border-dashed rounded-lg"
              >
                <Upload className="w-4 h-4 text-primary" />
                <span>{uploading ? "Inspecting & Uploading..." : "Upload New Image"}</span>
              </Button>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2.5">
              <Badge
                variant={product.stock_quantity > 0 ? "secondary" : "destructive"}
                className={`text-xs rounded-full ${
                  product.stock_quantity > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""
                }`}
              >
                {product.stock_quantity > 0 ? `${product.stock_quantity} units available` : "Out of Stock"}
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground rounded-full font-mono">
                Slug: {product.slug}
              </Badge>
            </div>
          </div>

          <div className="border-y py-4 flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground uppercase font-medium">Retail Price</span>
            <span className="text-3xl font-bold font-mono text-primary">${Number(product.price).toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Product Description</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {product.description || "No descriptive information provided for this product entry."}
            </p>
          </div>

          {hasConfidentialData ? (
            <Card className="border-amber-500/30 bg-amber-500/10 text-xs rounded-2xl shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Manager Wholesale Margin
                  </span>
                  <Badge variant="secondary" className="text-[10px] rounded-full">
                    PROTECTED
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Unit Cost Price:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-300 font-mono">${Number(product.cost_price).toFixed(2)}</span>
                </div>
                {product.supplier_notes && (
                  <div className="border-t border-amber-500/20 pt-2 text-muted-foreground text-[11px]">
                    Internal Note: {product.supplier_notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="p-3.5 rounded-2xl border border-dashed bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Confidential Margin
              </span>
              <span className="text-primary text-xs font-medium">Pruned via Zchema</span>
            </div>
          )}

          <Button
            onClick={() => addItem(product, 1)}
            disabled={product.stock_quantity <= 0}
            className="w-full h-11 text-sm font-semibold gap-2 rounded-xl shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </Button>
        </div>
      </div>
    </div>
  );
}