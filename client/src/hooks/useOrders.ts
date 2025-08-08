import { useMutation, useQuery } from "@tanstack/react-query";
import { OrderService } from "@/services/orderService";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Order, InsertOrder, CartItem } from "@/types";

export function useOrders(userId?: number) {
  const { toast } = useToast();

  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: userId ? ["/api/orders/user", userId] : ["/api/orders"],
    queryFn: () => OrderService.getOrders(userId),
  });

  const createOrderMutation = useMutation({
    mutationFn: OrderService.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order Created",
        description: "Your order has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order.",
        variant: "destructive",
      });
    },
  });

  const createOrderFromCartMutation = useMutation({
    mutationFn: ({ userId, cartItems, orderData }: { 
      userId: number; 
      cartItems: CartItem[]; 
      orderData: Partial<InsertOrder> 
    }) => OrderService.createOrderFromCart(userId, cartItems, orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Order Placed",
        description: "Your order has been placed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place order.",
        variant: "destructive",
      });
    },
  });

  return {
    orders,
    isLoading,
    error,
    createOrder: createOrderMutation.mutate,
    createOrderFromCart: createOrderFromCartMutation.mutate,
    isCreatingOrder: createOrderMutation.isPending || createOrderFromCartMutation.isPending,
  };
}

export function useAdminOrders() {
  const { toast } = useToast();

  const {
    data: orders = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/admin/orders"],
    queryFn: OrderService.getAllOrders,
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) =>
      OrderService.updateOrderStatus(id, status, adminNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  const updateTrackingMutation = useMutation({
    mutationFn: ({ id, trackingNumber }: { id: number; trackingNumber: string }) =>
      OrderService.updateTrackingNumber(id, trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Tracking Updated",
        description: "Tracking number has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tracking number.",
        variant: "destructive",
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      OrderService.cancelOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order Cancelled",
        description: "Order has been cancelled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel order.",
        variant: "destructive",
      });
    },
  });

  return {
    orders,
    isLoading,
    error,
    updateOrderStatus: updateOrderStatusMutation.mutate,
    updateTrackingNumber: updateTrackingMutation.mutate,
    cancelOrder: cancelOrderMutation.mutate,
    isUpdatingStatus: updateOrderStatusMutation.isPending,
    isUpdatingTracking: updateTrackingMutation.isPending,
    isCancellingOrder: cancelOrderMutation.isPending,
  };
}