export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string | null;
  price: number;
  cost_price?: number | null;
  supplier_notes?: string | null;
  stock_quantity: number;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface SearchFilter {
  field: string;
  op: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "ilike" | "in" | "between";
  value: any;
}

export interface SearchSort {
  field: string;
  order: "asc" | "desc";
}

export interface SearchRequest {
  filters?: SearchFilter[];
  sort?: SearchSort[];
  size?: number;
  cursor?: string | null;
}

export interface CursorPaginatedResponse<T> {
  items: T[];
  next_cursor?: string | null;
  has_more: boolean;
}

export interface CreateProductPayload {
  category_id: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost_price: number;
  supplier_notes?: string;
  stock_quantity: number;
  is_active?: boolean;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  is_active?: boolean;
}