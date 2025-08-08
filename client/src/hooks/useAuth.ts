import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { AuthService, LoginCredentials } from "@/services/authService";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: AuthService.getCurrentUser,
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}

export function useLogin() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: AuthService.login,
    onSuccess: (data) => {
      AuthService.setAuthData(data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });
}

export function useLogout() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      AuthService.logout();
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
    },
  });
}