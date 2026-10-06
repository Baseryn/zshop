// src/features/catalog/components/EditCategoryModal.tsx
import { useState, useEffect } from "react";
import { catalogApi } from "../api";
import { Category } from "@/types/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

interface EditCategoryModalProps {
  category: Category | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryUpdated?: () => void;
}

export function EditCategoryModal({
  category,
  open,
  onOpenChange,
  onCategoryUpdated,
}: EditCategoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setDescription(category.description || "");
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !name.trim()) return;

    setLoading(true);
    try {
      await catalogApi.updateCategory(category.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      toast.success("Category Updated", {
        description: `Category '${name}' updated successfully.`,
      });

      onOpenChange(false);
      onCategoryUpdated?.();
    } catch (err: any) {
      toast.error("Update Failed", {
        description: err.message || "Failed to update category.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" />
              <span>Edit Category: {category?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">Category Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name..."
              className="h-9 text-xs rounded-lg"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short category description..."
              className="h-20 text-xs rounded-lg resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              size="sm"
              className="w-full h-9 text-xs gap-2 rounded-lg font-bold shadow-sm"
            >
              <span>{loading ? "Saving Changes..." : "Update Category"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}