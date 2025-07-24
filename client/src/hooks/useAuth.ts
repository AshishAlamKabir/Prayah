import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isSubscribed: boolean;
  subscriptionExpiry?: string;
}

export function useAuth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("No token found");
      }

      try {
        const response = await apiRequest("GET", "/api/auth/me", undefined, {
          Authorization: `Bearer ${token}`,
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("auth-token");
            localStorage.removeItem("user");
            throw new Error("Session expired");
          }
          throw new Error("Failed to fetch user");
        }

        const userData = await response.json();
        localStorage.setItem("user", JSON.stringify(userData));
        return userData;
      } catch (error) {
        localStorage.removeItem("auth-token");
        localStorage.removeItem("user");
        throw error;
      }
    },
    retry: false,
    enabled: !!localStorage.getItem("auth-token"),
  });

  const logout = async () => {
    const token = localStorage.getItem("auth-token");
    if (token) {
      try {
        await apiRequest("POST", "/api/auth/logout", undefined, {
          Authorization: `Bearer ${token}`,
        });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    
    localStorage.removeItem("auth-token");
    localStorage.removeItem("user");
    queryClient.clear();
    setLocation("/");
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    isAdmin: user?.role === 'admin',
    isSubscriber: user?.isSubscribed || false,
    logout,
  };
}