import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        return null;
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const result = await response.json();
      console.log('Auth response:', result);
      return result.user || result;
    },
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}