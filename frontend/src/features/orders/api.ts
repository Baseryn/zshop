import { apiClient } from "@/lib/api-client";
import { OrderCreate, OrderResponse, OrderStatus } from "@/types/orders";

export const ordersApi = {
  placeOrder: async (data: OrderCreate): Promise<OrderResponse> => {
    return await apiClient<OrderResponse>("/checkout/orders/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getOrder: async (id: string): Promise<OrderResponse> => {
    return await apiClient<OrderResponse>(`/checkout/orders/${id}`);
  },

  getMyOrders: async (): Promise<OrderResponse[]> => {
    const res = await apiClient<any>("/checkout/orders/me");
    return Array.isArray(res) ? res : res.items || res.data || [];
  },

  getOrders: async (): Promise<OrderResponse[]> => {
    const res = await apiClient<any>("/checkout/orders/");
    return Array.isArray(res) ? res : res.items || [];
  },

  updateOrderStatus: async (id: string, status: OrderStatus, trackingCode?: string): Promise<OrderResponse> => {
    return await apiClient<OrderResponse>(`/checkout/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        tracking_code: trackingCode || undefined,
      }),
    });
  },
};