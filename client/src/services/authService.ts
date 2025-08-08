import { apiRequest } from "@/lib/queryClient";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: any;
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return await response.json();
  }

  static async getCurrentUser() {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;

    const response = await fetch("/api/auth/me", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (response.status === 401) {
      this.logout();
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch user");
    }

    const result = await response.json();
    return result.user || result;
  }

  static logout(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  }

  static setAuthData(data: AuthResponse): void {
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  static getAuthToken(): string | null {
    return localStorage.getItem("auth_token");
  }

  static isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}