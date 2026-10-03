import { useDevToolsStore } from "@/stores/devtoolsStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Clock, Hash } from "lucide-react";

export function NetworkTracker() {
  const { metrics, clearMetrics, selectedMetric, setSelectedMetric } = useDevToolsStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64 text-xs">
      <div className="flex flex-col border border-border/50 rounded-lg overflow-hidden bg-zinc-950/40">
        <div className="flex items-center justify-between p-2 border-b border-border/50 bg-secondary/20">
          <span className="text-[11px] text-muted-foreground">HTTP ACTIVITY ({metrics.length})</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMetrics}
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {metrics.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-xs font-sans">
              No HTTP requests recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {metrics.map((m) => {
                const isSelected = selectedMetric?.id === m.id;
                const isOk = m.status >= 200 && m.status < 300;

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMetric(m)}
                    className={`w-full text-left p-2 flex items-center justify-between hover:bg-secondary/40 transition-colors ${
                      isSelected ? "bg-accent/60 border-l-2 border-brand-500" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isOk ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {m.method}
                      </span>
                      <span className="truncate text-[11px] text-foreground">{m.url}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 text-muted-foreground text-[10px]">
                      <span>{m.durationMs}ms</span>
                      <Badge variant={isOk ? "outline" : "destructive"} className="text-[10px] h-4 px-1">
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

      <div className="border border-border/50 rounded-lg p-3 bg-zinc-950 flex flex-col justify-between overflow-y-auto">
        {selectedMetric ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="font-bold text-foreground text-[11px]">Request Details</span>
              <span className="text-muted-foreground text-[10px]">{selectedMetric.timestamp}</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="text-muted-foreground">Endpoint:</div>
              <div className="text-cyber-500 break-all">{selectedMetric.url}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  Latency:
                </span>
                <span className="text-emerald-400 font-semibold">{selectedMetric.durationMs} ms</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className={selectedMetric.status < 400 ? "text-emerald-400 ml-1 font-semibold" : "text-red-400 ml-1 font-semibold"}>
                  {selectedMetric.status}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] pt-1 border-t border-border/30">
              <span className="text-muted-foreground flex items-center gap-1">
                <Hash className="w-3 h-3 text-brand-500" />
                x-request-id (ZCore Correlation ID):
              </span>
              <div className="p-1.5 bg-secondary/30 rounded border border-border/40 text-brand-500 break-all text-[10px]">
                {selectedMetric.requestId || "Not returned by endpoint"}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-xs font-sans">
            Select a request on the left to inspect correlation metadata.
          </div>
        )}
      </div>
    </div>
  );
}