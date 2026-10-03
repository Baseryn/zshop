import { create } from "zustand";
import { CartItem } from "@/types/orders";
import { Product } from "@/types/catalog";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setOpen: (open: boolean) => void;
  
  // Getters
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: JSON.parse(localStorage.getItem("zshop_cart_items") || "[]"),
  isOpen: false,

  addItem: (product, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.product_id === product.id);
      let updatedItems: CartItem[];

      if (existing) {
        updatedItems = state.items.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        updatedItems = [
          ...state.items,
          {
            product_id: product.id,
            name: product.name,
            price: Number(product.price),
            sku: product.sku,
            image_url: product.image_url,
            stock_quantity: product.stock_quantity,
            quantity,
          },
        ];
      }

      localStorage.setItem("zshop_cart_items", JSON.stringify(updatedItems));
      return { items: updatedItems, isOpen: true };
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const updatedItems = state.items.filter((i) => i.product_id !== productId);
      localStorage.setItem("zshop_cart_items", JSON.stringify(updatedItems));
      return { items: updatedItems };
    });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set((state) => {
      const updatedItems = state.items.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i
      );
      localStorage.setItem("zshop_cart_items", JSON.stringify(updatedItems));
      return { items: updatedItems };
    });
  },

  clearCart: () => {
    localStorage.removeItem("zshop_cart_items");
    set({ items: [] });
  },

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),

  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  totalPrice: () =>
    get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
}));