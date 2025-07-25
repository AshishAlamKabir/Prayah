import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AddToCartButtonProps {
  bookId: number;
  title: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function AddToCartButton({ 
  bookId, 
  title, 
  className,
  variant = "default",
  size = "default"
}: AddToCartButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdded, setIsAdded] = useState(false);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        bookId,
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setIsAdded(true);
      toast({
        title: "Added to Cart",
        description: `"${title}" has been added to your cart.`,
      });
      
      // Reset the added state after 2 seconds
      setTimeout(() => setIsAdded(false), 2000);
    },
    onError: (error: any) => {
      if (error.message.includes("401")) {
        toast({
          title: "Please Log In",
          description: "You need to be logged in to add items to cart.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add item to cart. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  if (!user) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          toast({
            title: "Please Log In",
            description: "You need to be logged in to add items to cart.",
            variant: "destructive",
          });
        }}
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        Add to Cart
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => addToCartMutation.mutate()}
      disabled={addToCartMutation.isPending || isAdded}
    >
      {isAdded ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Added!
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4 mr-2" />
          {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
        </>
      )}
    </Button>
  );
}