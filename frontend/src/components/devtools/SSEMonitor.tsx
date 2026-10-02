import { useRealtimeStore } from "@/stores/realtimeStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Radio, Trash2, Activity } from "lucide-react";

export function SSEMonitor() {
  const { events, clearEvents, status } = useRealtimeStore();

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Radio className={`w-3.5 h-3.5 ${status === "connected" ? "text-emerald-400 animate-pulse" : "text-zinc-500"}`} />
          <span className="text-foreground text-[11px]">
            Live SSE Event Stream (/realtime/stream)
          </span>
          <Badge
            variant={status === "connected" ? "outline" : "secondary"}
            className={`text-[10px] ${status === "connected" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : ""}`}
          >
            {status.toUpperCase()}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearEvents}
          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Clear Log
        </Button>
      </div>

      <ScrollArea className="h-56 bg-zinc-950 rounded-lg border border-border/60 p-3">
        {events.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-muted-foreground font-sans text-xs space-y-2">
            <Activity className="w-6 h-6 text-zinc-600 animate-pulse" />
            <p>Waiting for SSE frames from server dispatcher...</p>
            <p className="text-[11px] text-zinc-500 font-mono">
              Place an order or switch order status to see live events.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((e) => (
              <div
                key={e.id}
                className="p-2.5 rounded bg-zinc-900/80 border border-border/40 space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-cyber-500 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    event: {e.event}
                  </span>
                  <span className="text-muted-foreground text-[10px]">{e.receivedAt}</span>
                </div>
                <pre className="text-emerald-400 text-[10px] overflow-x-auto p-1.5 bg-black/40 rounded">
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