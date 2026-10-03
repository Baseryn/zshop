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
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Dynamic Model Schema (GET /catalog/products/?schema=true)</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSchema}
          disabled={loading}
          className="h-8 text-xs gap-1.5 rounded-lg"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>Fetch Dynamic Schema</span>
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs">
          {error}
        </div>
      )}

      {schema ? (
        <pre className="bg-secondary/40 p-4 rounded-xl border text-foreground font-mono text-xs leading-relaxed max-h-60 overflow-x-auto">
          {JSON.stringify(schema, null, 2)}
        </pre>
      ) : (
        <div className="p-8 text-center text-muted-foreground text-xs">
          Click "Fetch Dynamic Schema" to inspect the JSON Schema generated on-the-fly by ZCore's BaseRouter.
        </div>
      )}
    </div>
  );
}