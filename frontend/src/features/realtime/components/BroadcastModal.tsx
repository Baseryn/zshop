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
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs rounded-lg"
        >
          <Megaphone className="w-4 h-4" />
          <span>System Broadcast</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl">
        <form onSubmit={handleBroadcast} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Radio className="w-5 h-5 text-amber-500 animate-pulse" />
              <span>Broadcast System Announcement</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-muted-foreground">
            Requires scope: <span className="text-amber-500 font-mono font-semibold">notifications:broadcast</span>. Emits live SSE frames to all connected listeners.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">Alert Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement Title..."
              className="h-9 text-xs rounded-lg"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase">Descriptive Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Announcement message content..."
              className="h-24 text-xs resize-none rounded-lg"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              size="sm"
              className="w-full h-9 text-xs gap-2 rounded-lg font-bold shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? "Emitting..." : "Dispatch to Stream"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}