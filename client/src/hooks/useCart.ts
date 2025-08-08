import { useMutation, useQuery } from "@tanstack/react-query";
import { CartService } from "@/services/cartService";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CartItem, InsertCartItem } from "@/types";

export function useCart(userId: number) {
  const { toast } = useToast();

  const {
    data: cartItems = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/cart", userId],
    queryFn: () => CartService.getCartItems(userId),
    enabled: !!userId,
  });

  const addToCartMutation = useMutation({
    mutationFn: CartService.addToCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      toast({
        title: "Added to Cart",
        description: "Item has been added to your cart successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart.",
        variant: "destructive",
      });
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      CartService.updateCartItem(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      toast({
        title: "Cart Updated",
        description: "Cart item quantity has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update cart item.",
        variant: "destructive",
      });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: CartService.removeFromCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      toast({
        title: "Item Removed",
        description: "Item has been removed from your cart.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove item from cart.",
        variant: "destructive",
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => CartService.clearCart(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart", userId] });
      toast({
        title: "Cart Cleared",
        description: "All items have been removed from your cart.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clear cart.",
        variant: "destructive",
      });
    },
  });

  const cartTotal = cartItems.reduce((total, item) => {
    return total + (item.book?.price || 0) * item.quantity;
  }, 0);

  const cartItemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return {
    cartItems,
    cartTotal,
    cartItemCount,
    isLoading,
    error,
    addToCart: addToCartMutation.mutate,
    updateCartItem: updateCartMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingCart: updateCartMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
  };
}