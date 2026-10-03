import { useState } from "react";
import { Product } from "@/types/catalog";
import { catalogApi } from "../api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldCheck, Box } from "lucide-react";
import { toast } from "sonner";

interface ProductManagementTableProps {
  products: Product[];
  onRefresh: () => void;
}

export function ProductManagementTable({ products, onRefresh }: ProductManagementTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to soft-delete '${name}'?`)) return;

    setDeletingId(id);
    try {
      await catalogApi.deleteProduct(id);
      toast.success("Product Deleted", {
        description: `Product '${name}' soft-deleted successfully.`,
      });
      onRefresh();
    } catch (err: any) {
      toast.error("Delete Failed", {
        description: err.message || "Failed to delete product.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {products.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-xs">
          No products currently available in catalog.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs uppercase font-semibold">Item</TableHead>
              <TableHead className="text-xs uppercase font-semibold">SKU</TableHead>
              <TableHead className="text-xs uppercase font-semibold">Retail Price</TableHead>
              <TableHead className="text-xs uppercase font-semibold">Cost Price</TableHead>
              <TableHead className="text-xs uppercase font-semibold">Stock</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-semibold text-foreground">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Box className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="truncate max-w-[200px]">
                      <div className="text-xs font-semibold">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{p.slug}</div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-xs font-mono">
                  <Badge variant="outline" className="font-mono text-[10px] rounded-md">
                    {p.sku}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs font-semibold text-primary font-mono">
                  ${Number(p.price).toFixed(2)}
                </TableCell>

                <TableCell className="text-xs font-mono">
                  {p.cost_price !== undefined && p.cost_price !== null ? (
                    <span className="text-amber-500 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      ${Number(p.cost_price).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[10px]">Restricted</span>
                  )}
                </TableCell>

                <TableCell>
                  <Badge
                    variant={p.stock_quantity > 0 ? "secondary" : "destructive"}
                    className="text-[10px] rounded-full font-mono"
                  >
                    {p.stock_quantity} units
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={deletingId === p.id}
                    onClick={() => handleDelete(p.id, p.name)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}