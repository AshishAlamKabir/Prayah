import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminService, AdminStats, AdminNotification, DashboardData } from "@/services/adminService";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAdminDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["/api/admin/dashboard"],
    queryFn: AdminService.getDashboardData,
  });
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: AdminService.getAdminStats,
  });
}

export function useAdminNotifications() {
  return useQuery<AdminNotification[]>({
    queryKey: ["/api/admin/notifications"],
    queryFn: AdminService.getAdminNotifications,
  });
}

export function useMarkNotificationAsRead() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: AdminService.markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    },
  });
}

export function useCreateNotification() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: AdminService.createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Success",
        description: "Notification created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create notification. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteNotification() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: AdminService.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Success",
        description: "Notification deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete notification. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useExportData() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: AdminService.exportData,
    onSuccess: (blob: Blob, variables: 'books' | 'orders' | 'users') => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${variables}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${variables} data has been exported successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    },
  });
}