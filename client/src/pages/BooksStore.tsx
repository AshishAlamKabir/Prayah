import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Search, Star, BookOpen } from "lucide-react";
import { AddToCartButton } from "@/components/AddToCartButton";

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
  category: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function BooksStore() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch books from the API with aggressive refresh
  const { data: books = [], isLoading, refetch } = useQuery<Book[]>({
    queryKey: ['/api/books'],
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache for long
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Get unique genres for filter
  const genres = Array.from(new Set(books.map((book) => book.genre).filter(Boolean)));

  // Filter books based on search and genre
  const filteredBooks = books.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === "all" || book.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">প্রয়াস বই স্টোর</h1>
          <p className="text-gray-600 text-lg">Discover amazing books and add them to your collection</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="w-fit"
          >
            Refresh Books
          </Button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search books by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by genre" />
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

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {book.imageUrl ? (
                    <img 
                      src={book.imageUrl} 
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                <CardDescription>by {book.author}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">₹{book.price}</span>
                    <Badge variant={book.stock > 0 ? "default" : "destructive"}>
                      {book.stock > 0 ? `${book.stock} in stock` : "Out of stock"}
                    </Badge>
                  </div>
                  
                  {book.genre && (
                    <Badge variant="outline" className="text-xs">
                      {book.genre}
                    </Badge>
                  )}
                  
                  {book.rating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 text-sm">{book.rating}</span>
                    </div>
                  )}
                  
                  {book.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {book.description}
                    </p>
                  )}
                  
                  {/* Add to Cart Button */}
                  <AddToCartButton book={book} className="w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No books found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or browse all genres.</p>
          </div>
        )}
      </div>
    </div>
  );
}