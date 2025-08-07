import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Search, Star, Plus, Minus } from "lucide-react";

interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  description: string;
  genre: string;
  stock: number;
  imageUrl?: string;
  rating?: number;
}

interface CartItem extends Book {
  quantity: number;
}

export default function BooksStore() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch books from the API
  const { data: books = [], isLoading } = useQuery<Book[]>({
    queryKey: ['/api/books'],
  });

  // Get unique genres for filter
  const genres = Array.from(new Set(books.map((book) => book.genre).filter(Boolean)));

  // Filter books based on search and genre
  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === "all" || book.genre === selectedGenre;
    return matchesSearch && matchesGenre && book.stock > 0;
  });

  // Add to cart function
  const addToCart = (book: Book) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === book.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === book.id 
            ? { ...item, quantity: Math.min(item.quantity + 1, book.stock) }
            : item
        );
      } else {
        return [...prevCart, { ...book, quantity: 1 }];
      }
    });
    
    toast({
      title: "Added to Cart",
      description: `${book.title} has been added to your cart.`,
    });
  };

  // Update cart quantity
  const updateQuantity = (bookId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== bookId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === bookId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            bookId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: cartTotal
        })
      });
      if (!response.ok) throw new Error('Checkout failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Placed Successfully",
        description: "Your order has been placed and will be processed soon.",
      });
      setCart([]);
      setShowCart(false);
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
    },
    onError: () => {
      toast({
        title: "Checkout Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Books Store</h1>
              <p className="text-gray-600 mt-1">Discover your next great read</p>
            </div>
            
            {/* Cart Button */}
            <Button 
              onClick={() => setShowCart(!showCart)}
              className="relative bg-red-600 hover:bg-red-700"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className={`${showCart ? 'lg:w-2/3' : 'w-full'} transition-all duration-300`}>
            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search books or authors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Select Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <Card key={book.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    {book.imageUrl ? (
                      <img 
                        src={book.imageUrl} 
                        alt={book.title}
                        className="w-full h-48 object-cover rounded-md mb-3"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                    
                    <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                    <CardDescription className="text-sm">by {book.author}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {book.genre && (
                        <Badge variant="secondary" className="text-xs">
                          {book.genre}
                        </Badge>
                      )}
                      
                      {book.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {book.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-green-600">
                            ${book.price.toFixed(2)}
                          </span>
                          <p className="text-xs text-gray-500">
                            {book.stock} in stock
                          </p>
                        </div>
                        
                        {book.rating && (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 text-sm">{book.rating}</span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => addToCart(book)}
                        className="w-full bg-red-600 hover:bg-red-700"
                        disabled={book.stock === 0}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredBooks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No books found matching your criteria.</p>
              </div>
            )}
          </div>

          {/* Shopping Cart Sidebar */}
          {showCart && (
            <div className="lg:w-1/3">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Shopping Cart
                    <Badge>{cartItemCount} items</Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between border-b pb-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            <p className="text-gray-600 text-xs">{item.author}</p>
                            <p className="text-green-600 font-bold">${item.price.toFixed(2)}</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="mx-2 min-w-[2ch] text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Total: ${cartTotal.toFixed(2)}</span>
                        </div>
                        
                        <Button 
                          className="w-full mt-4 bg-green-600 hover:bg-green-700"
                          onClick={() => checkoutMutation.mutate()}
                          disabled={checkoutMutation.isPending}
                        >
                          {checkoutMutation.isPending ? 'Processing...' : 'Checkout'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}