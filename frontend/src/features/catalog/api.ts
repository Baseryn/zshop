import { apiClient } from "@/lib/api-client";
import { Product, Category, SearchRequest, CreateProductPayload, CreateCategoryPayload } from "@/types/catalog";

export const catalogApi = {
  searchProducts: async (params: SearchRequest): Promise<Product[]> => {
    const res = await apiClient<any>("/catalog/products/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return Array.isArray(res) ? res : res?.items || res?.data || [];
  },

  lookupProducts: async (params: SearchRequest): Promise<Product[]> => {
    const res = await apiClient<any>("/catalog/products/lookup", {
      method: "POST",
      body: JSON.stringify(params),
    });
    return Array.isArray(res) ? res : res?.items || res?.data || [];
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient<any>("/catalog/categories/lookup", {
      method: "POST",
      body: JSON.stringify({ size: 100 }),
    });
    return Array.isArray(res) ? res : res?.items || res?.data || [];
  },

  getProductById: async (id: string): Promise<Product> => {
    return await apiClient<Product>(`/catalog/products/${id}`);
  },

  createProduct: async (data: CreateProductPayload): Promise<Product> => {
    return await apiClient<Product>("/catalog/products/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateProduct: async (id: string, data: Partial<CreateProductPayload>): Promise<Product> => {
    return await apiClient<Product>(`/catalog/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  uploadProductImage: async (id: string, file: File): Promise<Product> => {
    const formData = new FormData();
    formData.append("file", file);
    return await apiClient<Product>(`/catalog/products/${id}/image`, {
      method: "POST",
      body: formData,
    });
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient<void>(`/catalog/products/${id}`, {
      method: "DELETE",
    });
  },

  createCategory: async (data: CreateCategoryPayload): Promise<Category> => {
    return await apiClient<Category>("/catalog/categories/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient<void>(`/catalog/categories/${id}`, {
      method: "DELETE",
    });
  },
};