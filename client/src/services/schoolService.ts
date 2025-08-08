import { apiRequest } from "@/lib/queryClient";

export interface School {
  id: number;
  name: string;
  location: string;
  feePaymentEnabled: boolean;
  paymentMethods: string[];
  adminApprovalRequired: boolean;
  paymentConfig: any;
}

export interface PaymentSettings {
  feePaymentEnabled?: boolean;
  paymentMethods?: string[];
  adminApprovalRequired?: boolean;
  paymentConfig?: any;
}

export class SchoolService {
  static async getAllSchools(): Promise<School[]> {
    const response = await apiRequest("GET", "/api/schools");
    return await response.json();
  }

  static async getSchool(schoolId: number): Promise<School> {
    const response = await apiRequest("GET", `/api/schools/${schoolId}`);
    return await response.json();
  }

  static async updatePaymentSettings(schoolId: number, settings: PaymentSettings): Promise<void> {
    await apiRequest("PUT", `/api/admin/schools/${schoolId}/payment-settings`, settings);
  }

  static async createSchool(schoolData: Partial<School>): Promise<School> {
    const response = await apiRequest("POST", "/api/schools", schoolData);
    return await response.json();
  }

  static async updateSchool(schoolId: number, schoolData: Partial<School>): Promise<School> {
    const response = await apiRequest("PUT", `/api/schools/${schoolId}`, schoolData);
    return await response.json();
  }

  static async deleteSchool(schoolId: number): Promise<void> {
    await apiRequest("DELETE", `/api/schools/${schoolId}`);
  }
}