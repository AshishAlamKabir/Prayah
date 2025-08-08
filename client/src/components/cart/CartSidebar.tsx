import { useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/utils/business";

export function CartSidebar() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    cartItems,
    cartTotal,
    cartItemCount,
    isLoading,
    updateCartItem,
    removeFromCart,
    clearCart,
    isUpdatingCart,
    isRemovingFromCart,
  } = useCart(user?.id || 0);

  if (!user) return null;

  const handleQuantityChange = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateCartItem({ id, quantity: newQuantity });
    }
  };

  const handleCheckout = () => {
    // Navigate to checkout page
    setIsOpen(false);
    window.location.href = "/checkout";
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <ShoppingCart className="h-4 w-4" />
          {cartItemCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {cartItemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Shopping Cart</span>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearCart()}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-full">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-4">Add some books to get started!</p>
              <SheetClose asChild>
                <Button>Continue Shopping</Button>
              </SheetClose>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 py-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.book?.title}</h4>
                      <p className="text-sm text-gray-600 truncate">{item.book?.author}</p>
                      <p className="font-medium text-sm">{formatCurrency(item.book?.price || 0)}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={isUpdatingCart || isRemovingFromCart}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={isUpdatingCart}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        disabled={isRemovingFromCart}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(cartTotal)}</span>
                </div>
                
                <Button 
                  onClick={handleCheckout} 
                  className="w-full"
                  disabled={cartItems.length === 0}
                >
                  Proceed to Checkout
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}