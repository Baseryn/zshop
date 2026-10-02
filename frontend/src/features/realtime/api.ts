import { apiClient } from "@/lib/api-client";

export interface BroadcastRequest {
  title: string;
  message: string;
  target_user_ids?: string[];
}

export const realtimeApi = {
  broadcast: async (data: BroadcastRequest): Promise<{ message: string }> => {
    return await apiClient<any>("/realtime/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};