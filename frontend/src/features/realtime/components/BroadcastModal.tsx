import { useState } from "react";
import { realtimeApi } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Megaphone, Send, Radio } from "lucide-react";
import { toast } from "sonner";

export function BroadcastModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Flash Sale Starting Soon!");
  const [message, setMessage] = useState("All industrial power tools are 20% off for the next 2 hours.");
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setLoading(true);
    try {
      await realtimeApi.broadcast({ title, message });
      toast.success("Broadcast Dispatched", {
        description: "Message queued and dispatched via StreamManager.",
      });
      setOpen(false);
    } catch (err: any) {
      toast.error("Broadcast Failed", {
        description: err.message || "Scope 'notifications:broadcast' required.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs"
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>System Broadcast</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md text-xs">
        <form onSubmit={handleBroadcast} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2 text-foreground">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Broadcast System Announcement</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-[11px] text-muted-foreground font-sans">
            Requires scope: <span className="text-amber-400">notifications:broadcast</span>. Emits live SSE frames to all connected listeners.
          </p>

          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase">Alert Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement Title..."
              className="h-8 text-xs "
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase">Descriptive Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Announcement message content..."
              className="h-20 text-xs  resize-none"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              size="sm"
              className="w-full h-8 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
            >
              <Send className="w-3 h-3" />
              <span>{loading ? "Emitting..." : "Dispatch to Stream"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}