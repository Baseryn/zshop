import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useRealtimeStore } from "@/stores/realtimeStore";
import { toast } from "sonner";

export function useSSE() {
  const { token } = useAuthStore();
  const { setStatus, addEvent } = useRealtimeStore();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setStatus("disconnected");
      return;
    }

    const connect = () => {
      setStatus("connecting");

      const streamUrl = `/api/realtime/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setStatus("connected");
      };

      es.addEventListener("ping", (event) => {
        try {
          const parsed = JSON.parse(event.data);
          addEvent("ping", parsed);
        } catch {
          addEvent("ping", event.data);
        }
      });

      es.addEventListener("order.created", (event) => {
        try {
          const payload = JSON.parse(event.data);
          addEvent("order.created", payload);
          toast.success(payload.title || "Order Created!", {
            description: payload.message,
          });
        } catch (err) {
          console.error("Error parsing order.created frame", err);
        }
      });

      es.addEventListener("order.status_changed", (event) => {
        try {
          const payload = JSON.parse(event.data);
          addEvent("order.status_changed", payload);
          toast.info(payload.title || "Order Status Changed", {
            description: payload.message,
          });
        } catch (err) {
          console.error("Error parsing order.status_changed frame", err);
        }
      });

      es.addEventListener("system.announcement", (event) => {
        try {
          const payload = JSON.parse(event.data);
          addEvent("system.announcement", payload);
          toast.warning(payload.title || "System Announcement", {
            description: payload.message,
            duration: 6000,
          });
        } catch (err) {
          console.error("Error parsing system.announcement frame", err);
        }
      });

      es.onerror = () => {
        setStatus("error");
        es.close();

        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token, setStatus, addEvent]);
}