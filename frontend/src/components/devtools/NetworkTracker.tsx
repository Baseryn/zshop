import { useDevToolsStore } from "@/stores/devtoolsStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Clock, Hash } from "lucide-react";

export function NetworkTracker() {
  const { metrics, clearMetrics, selectedMetric, setSelectedMetric } = useDevToolsStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64 text-sm">
      <div className="flex flex-col border rounded-xl overflow-hidden bg-card">
        <div className="flex items-center justify-between p-3 border-b bg-muted/40">
          <span className="text-xs font-semibold text-muted-foreground">HTTP ACTIVITY ({metrics.length})</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMetrics}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {metrics.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-xs">
              No HTTP requests recorded yet.
            </div>
          ) : (
            <div className="divide-y">
              {metrics.map((m) => {
                const isSelected = selectedMetric?.id === m.id;
                const isOk = m.status >= 200 && m.status < 300;

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMetric(m)}
                    className={`w-full text-left p-3 flex items-center justify-between hover:bg-muted/50 transition-colors ${
                      isSelected ? "bg-secondary border-l-4 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Badge
                        variant={isOk ? "secondary" : "destructive"}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                      >
                        {m.method}
                      </Badge>
                      <span className="truncate text-xs font-medium">{m.url}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 text-muted-foreground text-xs font-mono">
                      <span>{m.durationMs}ms</span>
                      <Badge variant={isOk ? "outline" : "destructive"} className="text-[10px] h-5 px-1.5 rounded-full">
                        {m.status}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="border rounded-xl p-4 bg-card flex flex-col justify-between overflow-y-auto">
        {selectedMetric ? (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-semibold text-sm">Request Details</span>
              <span className="text-muted-foreground text-xs">{selectedMetric.timestamp}</span>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground font-medium">Endpoint:</div>
              <div className="text-primary font-mono break-all">{selectedMetric.url}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  Latency:
                </span>
                <span className="text-emerald-500 font-semibold font-mono">{selectedMetric.durationMs} ms</span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Status:</span>
                <span className={selectedMetric.status < 400 ? "text-emerald-500 ml-1.5 font-semibold font-mono" : "text-destructive ml-1.5 font-semibold font-mono"}>
                  {selectedMetric.status}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Hash className="w-3.5 h-3.5 text-primary" />
                x-request-id (ZCore Correlation ID):
              </span>
              <div className="p-2 bg-secondary rounded-lg border font-mono text-primary break-all text-[11px]">
                {selectedMetric.requestId || "Not returned by endpoint"}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
            Select a request on the left to inspect correlation metadata.
          </div>
        )}
      </div>
    </div>
  );
}