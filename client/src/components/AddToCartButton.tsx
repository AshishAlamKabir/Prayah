import { useState } from "react";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Book } from "@/types";

interface AddToCartButtonProps {
  book: Book;
  className?: string;
}

export function AddToCartButton({ book, className }: AddToCartButtonProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart, isAddingToCart } = useCart(user?.id || 0);

  if (!user) {
    return (
      <Button variant="outline" disabled className={className}>
        <ShoppingCart className="h-4 w-4 mr-2" />
        Login to Add to Cart
      </Button>
    );
  }

  if (book.stock <= 0) {
    return (
      <Button variant="outline" disabled className={className}>
        Out of Stock
      </Button>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      userId: user.id,
      bookId: book.id,
      quantity,
    });
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= book.stock) {
      setQuantity(newQuantity);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center border rounded">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={quantity <= 1}
          className="h-8 w-8 p-0"
        >
          <Minus className="h-3 w-3" />
        </Button>
        
        <Input
          type="number"
          value={quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
          className="w-16 h-8 text-center border-0 focus:ring-0"
          min={1}
          max={book.stock}
        />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={quantity >= book.stock}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      <Button
        onClick={handleAddToCart}
        disabled={isAddingToCart || book.stock < quantity}
        className="flex-1"
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        {isAddingToCart ? "Adding..." : "Add to Cart"}
      </Button>
    </div>
  );
}