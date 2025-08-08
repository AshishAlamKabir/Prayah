import { apiRequest } from "@/lib/queryClient";
import { Order, InsertOrder, OrderItem, CartItem } from "@/types";

export class OrderService {
  static async createOrder(orderData: InsertOrder): Promise<Order> {
    const response = await apiRequest("POST", "/api/orders", orderData);
    return await response.json();
  }

  static async createOrderFromCart(userId: number, cartItems: CartItem[], orderData: Partial<InsertOrder>): Promise<Order> {
    const totalAmount = cartItems.reduce((total, item) => {
      return total + (item.book?.price || 0) * item.quantity;
    }, 0);

    const order = await this.createOrder({
      userId,
      totalAmount,
      currency: "inr",
      ...orderData,
    });

    return order;
  }

  static async getOrders(userId?: number): Promise<Order[]> {
    const url = userId ? `/api/orders/user/${userId}` : "/api/orders";
    const response = await apiRequest("GET", url);
    return await response.json();
  }

  static async getOrder(id: number): Promise<Order> {
    const response = await apiRequest("GET", `/api/orders/${id}`);
    return await response.json();
  }

  static async updateOrderStatus(id: number, status: string, adminNotes?: string): Promise<void> {
    await apiRequest("PUT", `/api/orders/${id}/status`, { status, adminNotes });
  }

  static async updateTrackingNumber(id: number, trackingNumber: string): Promise<void> {
    await apiRequest("PUT", `/api/orders/${id}/tracking`, { trackingNumber });
  }

  static async cancelOrder(id: number, reason?: string): Promise<void> {
    await apiRequest("PUT", `/api/orders/${id}/cancel`, { reason });
  }

  static async getAllOrders(): Promise<Order[]> {
    const response = await apiRequest("GET", "/api/admin/orders");
    return await response.json();
  }

  static generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${timestamp.slice(-8)}-${random}`;
  }

  static getOrderStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'confirmed':
        return 'blue';
      case 'processing':
        return 'purple';
      case 'shipped':
        return 'orange';
      case 'delivered':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  }

  static getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'refunded':
        return 'orange';
      default:
        return 'gray';
    }
  }
}