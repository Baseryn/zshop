import { useState } from "react";
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { FolderPlus, Plus } from "lucide-react";
import { toast } from "sonner";

interface CreateCategoryModalProps {
  onCategoryCreated?: (category: Category) => void;
}

export function CreateCategoryModal({ onCategoryCreated }: CreateCategoryModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const created = await catalogApi.createCategory({
        name: name.trim(),
        description: description.trim() || undefined,
        is_active: true,
      });

      toast.success("Category Created", {
        description: `Category '${created.name}' has been added with slug '${created.slug}'.`,
      });

      setName("");
      setDescription("");
      setOpen(false);
      onCategoryCreated?.(created);
    } catch (err: any) {
      toast.error("Creation Failed", {
        description: err.message || "Failed to create category.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 rounded-lg text-xs font-medium">
          <FolderPlus className="w-4 h-4 text-primary" />
          <span>New Category</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-primary" />
              <span>Create Product Category</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">Category Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Industrial Tools"
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
              <Plus className="w-4 h-4" />
              <span>{loading ? "Creating..." : "Save Category"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}