import { apiRequest } from "@/lib/queryClient";
import { CartItem, InsertCartItem } from "@/types";

export class CartService {
  static async getCartItems(userId: number): Promise<CartItem[]> {
    const response = await apiRequest("GET", `/api/cart/${userId}`);
    return await response.json();
  }

  static async addToCart(cartItem: InsertCartItem): Promise<void> {
    await apiRequest("POST", "/api/cart", cartItem);
  }

  static async updateCartItem(id: number, quantity: number): Promise<void> {
    await apiRequest("PUT", `/api/cart/${id}`, { quantity });
  }

  static async removeFromCart(id: number): Promise<void> {
    await apiRequest("DELETE", `/api/cart/${id}`);
  }

  static async clearCart(userId: number): Promise<void> {
    await apiRequest("DELETE", `/api/cart/user/${userId}`);
  }

  static async getCartTotal(cartItems: CartItem[]): Promise<number> {
    return cartItems.reduce((total, item) => {
      return total + (item.book?.price || 0) * item.quantity;
    }, 0);
  }

  static async getCartItemCount(cartItems: CartItem[]): Promise<number> {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }
}