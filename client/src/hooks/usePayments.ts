import { useQuery, useMutation } from "@tanstack/react-query";
import { PaymentService, PaymentNotification, FeePayment } from "@/services/paymentService";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function usePaymentNotifications() {
  return useQuery<PaymentNotification[]>({
    queryKey: ["/api/admin/payment-notifications"],
    queryFn: PaymentService.getPaymentNotifications,
  });
}

export function usePaymentStats(schools: any[] = []) {
  return useQuery({
    queryKey: ["/api/payment-stats", schools.length],
    queryFn: () => PaymentService.getPaymentStats(schools),
    enabled: schools.length > 0,
  });
}

export function useCreateFeePayment() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: PaymentService.createFeePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-notifications"] });
      toast({
        title: "Payment Processed",
        description: "Fee payment has been processed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Payment Failed",
        description: "Failed to process fee payment. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useProcessPayment() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: PaymentService.processPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payment-notifications"] });
      toast({
        title: "Payment Successful",
        description: "Payment has been processed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    },
  });
}