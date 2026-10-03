import { useState, useEffect } from "react";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, PackagePlus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface CreateProductModalProps {
  categories: Category[];
  onProductCreated?: (product: Product) => void;
}

export function CreateProductModal({ categories, onProductCreated }: CreateProductModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("10");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const generateSku = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    setSku(`PROD-${randomSuffix}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !price || !costPrice || !categoryId) {
      toast.error("Validation Error", { description: "Please fill all required fields." });
      return;
    }

    setLoading(true);
    try {
      const created = await catalogApi.createProduct({
        category_id: categoryId,
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        price: parseFloat(price),
        cost_price: parseFloat(costPrice),
        stock_quantity: parseInt(stockQuantity, 10) || 0,
        supplier_notes: supplierNotes.trim() || undefined,
        description: description.trim() || undefined,
        is_active: true,
      });

      toast.success("Product Created", {
        description: `Product '${created.name}' created with SKU: ${created.sku}.`,
      });

      setName("");
      setSku("");
      setPrice("");
      setCostPrice("");
      setSupplierNotes("");
      setDescription("");
      setOpen(false);
      onProductCreated?.(created);
    } catch (err: any) {
      toast.error("Creation Failed", {
        description: err.message || "Failed to create product.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-2 rounded-lg text-xs font-semibold shadow-sm">
          <PackagePlus className="w-4 h-4" />
          <span>Add Product</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-primary" />
              <span>Create Catalog Product</span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase">Product Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wireless Precision Drill"
                className="h-9 text-xs rounded-lg"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase">SKU Code *</label>
                <button
                  type="button"
                  onClick={generateSku}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  Generate
                </button>
              </div>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. PROD-HD92"
                className="h-9 text-xs font-mono uppercase rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase">Retail Price ($) *</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="120.00"
                className="h-9 text-xs font-mono rounded-lg"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-amber-500">
                <ShieldAlert className="w-3.5 h-3.5" />
                <label className="text-xs font-semibold uppercase">Cost Price ($) *</label>
              </div>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="45.00"
                className="h-9 text-xs font-mono rounded-lg border-amber-500/30 bg-amber-500/5"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase">Initial Stock *</label>
              <Input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="10"
                className="h-9 text-xs font-mono rounded-lg"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">Assigned Category *</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-9 text-xs rounded-lg">
                <SelectValue placeholder="Select a category..." />
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
            <label className="text-xs font-medium text-muted-foreground uppercase">Supplier Terms & Notes (Confidential)</label>
            <Input
              value={supplierNotes}
              onChange={(e) => setSupplierNotes(e.target.value)}
              placeholder="e.g. Factory warranty terms, batch invoice ID..."
              className="h-9 text-xs rounded-lg border-amber-500/30 bg-amber-500/5"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">Public Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of product features..."
              className="h-20 text-xs rounded-lg resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading || !categories.length}
              size="sm"
              className="w-full h-9 text-xs gap-2 rounded-lg font-bold shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? "Persisting Product..." : "Create Product"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}