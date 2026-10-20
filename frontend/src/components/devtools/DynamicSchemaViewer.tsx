import { useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Code2 } from "lucide-react";

export function DynamicSchemaViewer() {
  const [schema, setSchema] = useState<any | null>(null);
  const [selectedAction, setSelectedAction] = useState<"view" | "create" | "update" | "all">("view");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = async (action: "view" | "create" | "update" | "all" = selectedAction) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint =
        action === "all"
          ? "/catalog/products/_schema"
          : `/catalog/products/_schema?action=${action}`;

      const data = await apiClient<any>(endpoint);
      setSchema(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch schema");
    } finally {
      setLoading(false);
    }
  };

  const handleActionChange = (action: "view" | "create" | "update" | "all") => {
    setSelectedAction(action);
    fetchSchema(action);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between pb-2 border-b gap-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            Dynamic Model Schema (GET /catalog/products/_schema)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {(["view", "create", "update", "all"] as const).map((act) => (
            <Badge
              key={act}
              variant={selectedAction === act ? "default" : "outline"}
              onClick={() => handleActionChange(act)}
              className="cursor-pointer text-[11px] uppercase font-mono px-2 py-0.5"
            >
              {act}
            </Badge>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSchema(selectedAction)}
            disabled={loading}
            className="h-8 text-xs gap-1.5 rounded-lg ml-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Fetch</span>
          </Button>
        </div>
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
          Click &quot;Fetch&quot; to inspect the JSON Schema generated on-the-fly by ZCore&apos;s BaseRouter.
        </div>
      )}
    </div>
  );
}