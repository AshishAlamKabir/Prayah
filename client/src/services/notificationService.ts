import { apiRequest } from "@/lib/queryClient";

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  paymentNotifications: boolean;
  adminNotifications: boolean;
}

export interface SystemNotification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'payment' | 'admin' | 'system' | 'book' | 'order';
  read: boolean;
  createdAt: string;
  data?: any;
}

export class NotificationService {
  static async getUserNotifications(userId?: number): Promise<SystemNotification[]> {
    const url = userId ? `/api/notifications/user/${userId}` : '/api/notifications';
    const response = await apiRequest("GET", url);
    return await response.json();
  }

  static async markAsRead(notificationId: number): Promise<void> {
    await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
  }

  static async markAllAsRead(userId?: number): Promise<void> {
    const url = userId ? `/api/notifications/user/${userId}/read-all` : '/api/notifications/read-all';
    await apiRequest("PUT", url);
  }

  static async deleteNotification(notificationId: number): Promise<void> {
    await apiRequest("DELETE", `/api/notifications/${notificationId}`);
  }

  static async getNotificationPreferences(userId: number): Promise<NotificationPreferences> {
    const response = await apiRequest("GET", `/api/notifications/preferences/${userId}`);
    return await response.json();
  }

  static async updateNotificationPreferences(
    userId: number, 
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const response = await apiRequest("PUT", `/api/notifications/preferences/${userId}`, preferences);
    return await response.json();
  }

  static async sendNotification(notification: {
    userId: number;
    title: string;
    message: string;
    type: string;
    data?: any;
  }): Promise<SystemNotification> {
    const response = await apiRequest("POST", "/api/notifications", notification);
    return await response.json();
  }

  static async getUnreadCount(userId?: number): Promise<number> {
    const url = userId ? `/api/notifications/user/${userId}/unread-count` : '/api/notifications/unread-count';
    const response = await apiRequest("GET", url);
    const data = await response.json();
    return data.count;
  }
}