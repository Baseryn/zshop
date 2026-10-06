import { useRealtimeStore } from "@/stores/realtimeStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Radio, Trash2, Activity } from "lucide-react";

export function SSEMonitor() {
  const { events, clearEvents, status } = useRealtimeStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2.5">
          <Radio className={`w-4 h-4 ${status === "connected" ? "text-primary animate-pulse" : "text-muted-foreground"}`} />
          <span className="text-sm font-medium">
            Live SSE Event Stream (/realtime/stream)
          </span>
          <Badge
            variant={status === "connected" ? "secondary" : "outline"}
            className={`text-xs rounded-full ${status === "connected" ? "border-primary/30 text-primary bg-primary/10" : ""}`}
          >
            {status.toUpperCase()}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearEvents}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Clear Log
        </Button>
      </div>

      <ScrollArea className="h-60 bg-secondary/30 rounded-xl border p-3">
        {events.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-muted-foreground text-xs space-y-2">
            <Activity className="w-6 h-6 text-muted-foreground animate-pulse" />
            <p>Waiting for SSE frames from server dispatcher...</p>
            <p className="text-xs text-muted-foreground font-mono">
              Place an order or switch order status to see live events.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {events.map((e) => (
              <div
                key={e.id}
                className="p-3 rounded-lg bg-card border shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary font-bold font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    event: {e.event}
                  </span>
                  <span className="text-muted-foreground text-[11px]">{e.receivedAt}</span>
                </div>
                <pre className="text-foreground font-mono text-[11px] overflow-x-auto p-2.5 bg-muted rounded-md">
                  {JSON.stringify(e.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}