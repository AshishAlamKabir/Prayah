import { apiRequest } from "@/lib/queryClient";

export interface AdminStats {
  totalUsers: number;
  totalBooks: number;
  totalOrders: number;
  totalRevenue: number;
  activeSchools: number;
  pendingPublications: number;
}

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
}

export interface DashboardData {
  stats: AdminStats;
  recentNotifications: AdminNotification[];
  recentOrders: any[];
  lowStockBooks: any[];
}

export class AdminService {
  static async getDashboardData(): Promise<DashboardData> {
    const response = await apiRequest("GET", "/api/admin/dashboard");
    return await response.json();
  }

  static async getAdminStats(): Promise<AdminStats> {
    const response = await apiRequest("GET", "/api/admin/stats");
    return await response.json();
  }

  static async getAdminNotifications(): Promise<AdminNotification[]> {
    const response = await apiRequest("GET", "/api/admin/notifications");
    return await response.json();
  }

  static async markNotificationAsRead(notificationId: number): Promise<void> {
    await apiRequest("PUT", `/api/admin/notifications/${notificationId}/read`);
  }

  static async createNotification(notification: Partial<AdminNotification>): Promise<AdminNotification> {
    const response = await apiRequest("POST", "/api/admin/notifications", notification);
    return await response.json();
  }

  static async deleteNotification(notificationId: number): Promise<void> {
    await apiRequest("DELETE", `/api/admin/notifications/${notificationId}`);
  }

  static async exportData(type: 'books' | 'orders' | 'users'): Promise<Blob> {
    const response = await fetch(`/api/admin/export/${type}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to export ${type}`);
    }
    
    return await response.blob();
  }
}