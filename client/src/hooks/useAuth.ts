import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);

  // Try to get user from localStorage first
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setLocalUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    } finally {
      setIsLoadingLocal(false);
    }
  }, []);
  
  const { data: serverUser, isLoading: isLoadingServer, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !localUser, // Only fetch if no local user
  });

  const logout = () => {
    // Clear local storage immediately
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    setLocalUser(null);
    queryClient.clear();
    
    // Try to logout from server (optional, won't fail if no auth)
    try {
      apiRequest("POST", "/api/auth/logout").catch(() => {
        // Ignore server logout errors since we've already cleared locally
      });
    } catch (error) {
      // Ignore errors
    }
    
    // Redirect to home
    window.location.href = "/";
  };

  const user = localUser || serverUser;
  const isLoading = isLoadingLocal || (isLoadingServer && !localUser);
  const isSubscribed = user?.subscriptionExpiry ? new Date(user.subscriptionExpiry) > new Date() : false;

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isSubscribed,
    isAdmin: user?.role === "admin",
    isSubscriber: isSubscribed,
    logout,
  };
}