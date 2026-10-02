export interface RealtimeNotificationPayload {
  id: string;
  event: string;
  title: string;
  message: string;
  data: Record<string, any>;
  timestamp: string;
}

export type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error";

export interface StreamEventLog {
  id: string;
  event: string;
  data: any;
  receivedAt: string;
}