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
    <div className="space-y-6 text-sm">
      <div className="flex items-center justify-between pb-3 border-b">
        <span className="font-semibold text-foreground tracking-wide uppercase text-xs">
          Dynamic Filters
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground rounded-md"
        >
          <FilterX className="w-3.5 h-3.5 mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase">Search Term</label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or sku..."
            className="pl-9 h-9 text-xs rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium uppercase">Price Range</span>
          <span className="text-primary font-bold font-mono">
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
        <label className="text-xs font-medium text-muted-foreground uppercase">Category</label>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onCategorySelect(null)}
            className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === null
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors truncate ${
                selectedCategory === cat.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-secondary"
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