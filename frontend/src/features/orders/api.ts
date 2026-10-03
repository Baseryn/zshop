import { apiClient } from "@/lib/api-client";
import { OrderCreate, OrderResponse } from "@/types/orders";

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

  getOrders: async (): Promise<OrderResponse[]> => {
    const res = await apiClient<any>("/checkout/orders/");
    return Array.isArray(res) ? res : res.items || [];
  },
};