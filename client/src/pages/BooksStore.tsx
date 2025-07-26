import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Book, Search, ShoppingCart, Download, Star, Lock, Crown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import AddToCartButton from "@/components/AddToCartButton";
import { Link } from "wouter";

export default function BooksStore() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showSubscriptionOnly, setShowSubscriptionOnly] = useState(false);
  const { user, isAuthenticated, isSubscriber } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: books, isLoading } = useQuery({
    queryKey: ["/api/books", selectedCategory, showSubscriptionOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      if (showSubscriptionOnly) {
        params.append("featured", "true");
      }
      
      const token = localStorage.getItem("auth-token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await apiRequest("GET", `/api/books?${params.toString()}`, undefined, headers);
      return response.json();
    }
  });

  const orderMutation = useMutation({
    mutationFn: async (bookData: any) => {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("Please login to purchase books");
      }
      
      const response = await apiRequest("POST", "/api/orders", bookData, {
        Authorization: `Bearer ${token}`
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Placed",
        description: "Your book order has been placed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("auth-token");
      if (!token) {
        throw new Error("Please login to subscribe");
      }
      
      const response = await apiRequest("POST", "/api/subscribe", {}, {
        Authorization: `Bearer ${token}`
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Activated",
        description: "Welcome to Prayas Premium! You now have access to all books.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchase = (book: any) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to purchase books",
        variant: "destructive",
      });
      return;
    }

    orderMutation.mutate({
      bookId: book.id,
      amount: book.price,
      isSubscription: false,
      paymentMethod: "card"
    });
  };

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to subscribe",
        variant: "destructive",
      });
      return;
    }
    
    subscribeMutation.mutate();
  };

  const filteredBooks = books?.filter((book: any) => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const categories = [...new Set(books?.map((book: any) => book.category) || [])];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 dark:from-red-950 dark:to-green-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-100 dark:bg-red-900 rounded-full">
              <Book className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-4">
            Prayas Books Store
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">
            Discover books focused on education, culture, and community development.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/cart">
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart
              </Button>
            </Link>
          </div>
        </div>

        {/* Subscription Banner */}
        {!isSubscriber && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-200 dark:bg-yellow-800 rounded-full">
                    <Crown className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                      Prayas Premium Subscription
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      Get unlimited access to all books and exclusive PDF downloads for $99.99/year
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleSubscribe}
                  disabled={subscribeMutation.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {subscribeMutation.isPending ? "Processing..." : "Subscribe Now"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search books, authors, topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isSubscriber && (
                <Button
                  variant={showSubscriptionOnly ? "default" : "outline"}
                  onClick={() => setShowSubscriptionOnly(!showSubscriptionOnly)}
                >
                  Premium Only
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book: any) => (
            <Card key={book.id} className="hover:shadow-xl transition-shadow duration-300">
              <div className="relative">
                {book.imageUrl ? (
                  <img
                    src={book.imageUrl}
                    alt={book.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 rounded-t-lg flex items-center justify-center">
                    <Book className="w-16 h-16 text-red-600 dark:text-red-400" />
                  </div>
                )}
                
                {book.featured && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-900">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                
                {book.subscriptionOnly && !isSubscriber && (
                  <Badge className="absolute top-2 right-2 bg-purple-500 text-white">
                    <Lock className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  by {book.author}
                  {book.editor && <span className="text-gray-500"> • edited by {book.editor}</span>}
                </p>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                  {book.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  <Badge variant="secondary">{book.category}</Badge>
                  {book.tags?.slice(0, 2).map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${book.price}
                  </div>
                  
                  <div className="flex gap-2">
                    {book.pdfUrl && (isSubscriber || !book.subscriptionOnly) && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={book.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    
                    {!book.subscriptionOnly || isSubscriber ? (
                      book.inStock ? (
                        <AddToCartButton
                          bookId={book.id}
                          title={book.title}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        />
                      ) : (
                        <Button size="sm" disabled>
                          Out of Stock
                        </Button>
                      )
                    ) : (
                      <Button size="sm" variant="outline" onClick={handleSubscribe}>
                        <Crown className="w-4 h-4 mr-1" />
                        Subscribe
                      </Button>
                    )}
                  </div>
                </div>
                
                {book.isbn && (
                  <p className="text-xs text-gray-500 mt-2">ISBN: {book.isbn}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No books found
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              Try adjusting your search or filters to find more books.
            </p>
          </div>
        )}

        {/* Featured Authors Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Featured Revolutionary Authors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Book className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-semibold mb-2">Revolutionary Thinkers</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Discover works by prominent revolutionary theorists and activists
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Book className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">Community Voices</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Books by local authors addressing community issues and solutions
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Book className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2">Educational Resources</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Learning materials for building revolutionary consciousness
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}