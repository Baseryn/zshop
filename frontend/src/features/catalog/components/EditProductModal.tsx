import { useState, useEffect, useRef, ChangeEvent } from "react";
import { catalogApi } from "../api";
import { Category, Product } from "@/types/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Upload, X } from "lucide-react";
import { toast } from "sonner";

interface EditProductModalProps {
  product: Product | null;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated?: () => void;
}

export function EditProductModal({
  product,
  categories,
  open,
  onOpenChange,
  onProductUpdated,
}: EditProductModalProps) {
  const [loading, setLoading] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [description, setDescription] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (product) {
      setCategoryId(product.category_id || "");
      setName(product.name || "");
      setSku(product.sku || "");
      setPrice(product.price ? product.price.toString() : "");
      setCostPrice(product.cost_price ? product.cost_price.toString() : "");
      setStockQuantity(product.stock_quantity !== undefined ? product.stock_quantity.toString() : "0");
      setSupplierNotes(product.supplier_notes || "");
      setDescription(product.description || "");
      setImagePreview(product.image_url || null);
      setImageFile(null);
    }
  }, [product]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !name.trim() || !sku.trim() || !price || !categoryId) {
      toast.error("Validation Error", { description: "Please fill all required fields." });
      return;
    }

    setLoading(true);
    try {
      await catalogApi.updateProduct(product.id, {
        category_id: categoryId,
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        price: parseFloat(price),
        cost_price: costPrice ? parseFloat(costPrice) : undefined,
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        supplier_notes: supplierNotes.trim() || undefined,
        description: description.trim() || undefined,
      });

      if (imageFile) {
        try {
          await catalogApi.uploadProductImage(product.id, imageFile);
        } catch (uploadErr: any) {
          toast.warning("Updated, but image upload failed", {
            description: uploadErr.message,
          });
        }
      }

      toast.success("Product Updated", {
        description: `Product '${name}' updated successfully.`,
      });

      onOpenChange(false);
      onProductUpdated?.();
    } catch (err: any) {
      toast.error("Update Failed", {
        description: err.message || "Failed to update product.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              <span>Edit Product: {product?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Product Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name..."
                className="h-9 text-xs rounded-lg"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">SKU Code *</label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU Code"
                className="h-9 text-xs font-mono uppercase rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Retail Price ($) *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-9 text-xs font-mono rounded-lg"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-amber-500 font-semibold">Cost Price ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="h-9 text-xs font-mono rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Available Stock *</label>
              <Input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="h-9 text-xs font-mono rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Category *</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-9 text-xs rounded-lg">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs rounded-md">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Supplier Notes (Confidential)</label>
              <Input
                value={supplierNotes}
                onChange={(e) => setSupplierNotes(e.target.value)}
                className="h-9 text-xs rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Product Image</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border bg-secondary/30">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-90 hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 border border-dashed rounded-xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors bg-secondary/10"
              >
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium">Click to upload new image</span>
                <span className="text-[10px] text-muted-foreground">PNG, JPG, WEBP up to 3MB</span>
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-20 text-xs rounded-lg resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              size="sm"
              className="w-full h-10 text-xs gap-2 rounded-lg font-bold shadow-sm"
            >
              <span>{loading ? "Saving Changes..." : "Update Product"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}