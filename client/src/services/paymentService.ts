import { apiRequest } from "@/lib/queryClient";

export interface PaymentNotification {
  id: number;
  schoolId: number;
  schoolName: string;
  amount: number;
  studentName: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface PaymentStats {
  totalSchools: number;
  enabledSchools: number;
  pendingNotifications: number;
  recentPayments: number;
}

export interface FeePayment {
  studentName: string;
  amount: number;
  paymentMethod: string;
  schoolId: number;
}

export class PaymentService {
  static async getPaymentNotifications(): Promise<PaymentNotification[]> {
    const response = await apiRequest("GET", "/api/admin/payment-notifications");
    return await response.json();
  }

  static async createFeePayment(paymentData: FeePayment): Promise<any> {
    const response = await apiRequest("POST", "/api/fee-payments", paymentData);
    return await response.json();
  }

  static async getPaymentStats(schools: any[]): Promise<PaymentStats> {
    const notifications = await this.getPaymentNotifications();
    
    return {
      totalSchools: schools.length,
      enabledSchools: schools.filter(s => s.feePaymentEnabled).length,
      pendingNotifications: notifications.filter(n => n.status === 'pending').length,
      recentPayments: notifications.filter(n => {
        const notifDate = new Date(n.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return notifDate > weekAgo;
      }).length
    };
  }

  static async processPayment(paymentData: any): Promise<any> {
    const response = await apiRequest("POST", "/api/payments/process", paymentData);
    return await response.json();
  }
}