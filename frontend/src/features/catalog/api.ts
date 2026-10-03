import { apiClient } from "@/lib/api-client";
import { Product, Category, SearchRequest } from "@/types/catalog";

export const catalogApi = {
  searchProducts: async (params: SearchRequest): Promise<{ items: Product[]; next_cursor?: string | null }> => {
    return await apiClient<any>("/catalog/products/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient<any>("/catalog/categories/");
    return Array.isArray(res) ? res : res.items || [];
  },

  getProductById: async (id: string): Promise<Product> => {
    return await apiClient<Product>(`/catalog/products/${id}`);
  },
};