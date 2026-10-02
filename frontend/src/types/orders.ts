export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItemCreate {
  product_id: string;
  quantity: number;
}

export interface OrderCreate {
  shipping_address: string;
  items: OrderItemCreate[];
}

export interface OrderItemResponse {
  id: string;
  order_id: string;
  product_id: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderResponse {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: string;
  tracking_code?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemResponse[];
}

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  sku: string;
  image_url?: string | null;
  stock_quantity: number;
  quantity: number;
}