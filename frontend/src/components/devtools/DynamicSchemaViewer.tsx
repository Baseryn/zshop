import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { RefreshCw, Code2 } from "lucide-react";

export function DynamicSchemaViewer() {
  const [schema, setSchema] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<any>("/catalog/products/?schema=true");
      setSchema(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch schema");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-brand-500" />
          <span className="text-foreground text-[11px]">Dynamic Model Schema (GET /catalog/products/?schema=true)</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSchema}
          disabled={loading}
          className="h-7 text-xs gap-1 border-border bg-secondary/30"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-brand-500" : ""}`} />
          <span>Fetch Dynamic Schema</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/20 border border-destructive text-destructive-foreground rounded text-[11px]">
          {error}
        </div>
      )}

      {schema ? (
        <pre className="bg-zinc-950 p-3 rounded-lg border border-border/60 text-cyber-500 overflow-x-auto text-[11px] leading-relaxed max-h-56">
          {JSON.stringify(schema, null, 2)}
        </pre>
      ) : (
        <div className="p-8 text-center text-muted-foreground font-sans text-xs">
          Click "Fetch Dynamic Schema" to inspect the JSON Schema generated on-the-fly by ZCore's BaseRouter.
        </div>
      )}
    </div>
  );
}