import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Category } from "@/types/catalog";
import { Search, FilterX } from "lucide-react";

interface CatalogFiltersProps {
  categories: Category[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (val: [number, number]) => void;
  selectedCategory: string | null;
  onCategorySelect: (id: string | null) => void;
  onReset: () => void;
}

export function CatalogFilters({
  categories,
  searchQuery,
  onSearchChange,
  priceRange,
  onPriceRangeChange,
  selectedCategory,
  onCategorySelect,
  onReset,
}: CatalogFiltersProps) {
  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <span className="font-semibold text-foreground tracking-wider uppercase text-[11px]">
          Dynamic Filters
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <FilterX className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] text-muted-foreground uppercase">Search Term</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or sku..."
            className="pl-8 h-8 text-xs font-mono bg-card/60"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground uppercase">Price Range</span>
          <span className="text-emerald-400 font-bold">
            ${priceRange[0]} - ${priceRange[1]}
          </span>
        </div>
        <Slider
          min={0}
          max={500}
          step={10}
          value={priceRange}
          onValueChange={(val) => onPriceRangeChange(val as [number, number])}
          className="py-1"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[11px] text-muted-foreground uppercase">Category</label>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onCategorySelect(null)}
            className={`text-left px-2.5 py-1.5 rounded text-xs transition-colors ${
              selectedCategory === null
                ? "bg-brand-500/10 text-brand-500 font-semibold border border-brand-500/20"
                : "text-muted-foreground hover:bg-secondary/40"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className={`text-left px-2.5 py-1.5 rounded text-xs transition-colors truncate ${
                selectedCategory === cat.id
                  ? "bg-brand-500/10 text-brand-500 font-semibold border border-brand-500/20"
                  : "text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}