import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, Search, Download, ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { Book as BookType } from "@shared/schema";

export default function Books() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const { data: books, isLoading } = useQuery<BookType[]>({
    queryKey: ["/api/books"],
  });

  const categories = Array.from(new Set(books?.map(book => book.category) || []));

  const filteredBooks = books?.filter((book) => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-red-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Revolutionary Literature
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Access to transformative books, free PDFs, and published works that inspire change
          </p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search books by title, author, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full text-lg border-2 border-gray-300 focus:border-red-800 focus:ring-red-800"
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full py-3 text-lg border-2 border-gray-300 focus:border-red-800">
                  <SelectValue placeholder="Select category" />
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
            </div>
          </div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="revolutionary-card overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-16 w-full mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-16">
              <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No books found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== "all" 
                  ? "No books match your current search and filter criteria"
                  : "No books are currently available in the catalog"
                }
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchTerm || selectedCategory !== "all" 
                    ? `Search Results (${filteredBooks.length})` 
                    : `All Books (${filteredBooks.length})`
                  }
                </h2>
                <div className="text-sm text-gray-600">
                  Showing {filteredBooks.length} of {books?.length || 0} books
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredBooks.map((book) => (
                  <Card key={book.id} className="revolutionary-card bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                    <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <Book className="h-16 w-16 text-amber-800" />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="bg-red-800 text-white text-xs px-2 py-1 rounded-full">
                          {book.category}
                        </span>
                        <span className="text-green-600 font-bold text-lg">₹{book.price}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{book.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">by {book.author}</p>
                      <p className="text-gray-700 text-sm mb-4 line-clamp-3">{book.description}</p>
                      
                      {book.isbn && (
                        <p className="text-xs text-gray-500 mb-2">ISBN: {book.isbn}</p>
                      )}
                      
                      {book.publishedYear && (
                        <p className="text-xs text-gray-500 mb-4">Published: {book.publishedYear}</p>
                      )}
                      
                      <div className="flex gap-2">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white flex-1 flex items-center justify-center gap-2"
                          disabled={!book.inStock}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {book.inStock ? "Buy Book" : "Out of Stock"}
                        </Button>
                        {book.pdfUrl && (
                          <Button 
                            variant="outline" 
                            className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white flex items-center justify-center gap-1"
                          >
                            <Download className="h-4 w-4" />
                            PDF
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Featured Collections</h3>
            <p className="text-lg text-gray-600">
              Curated collections of essential revolutionary literature
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-red-50 p-6 rounded-lg text-center">
              <Book className="h-12 w-12 text-red-800 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-3">Political Theory</h4>
              <p className="text-gray-700 mb-4">
                Essential texts on revolutionary theory, class struggle, and political economy.
              </p>
              <Button className="bg-green-600 hover:bg-green-700">
                Explore Collection
              </Button>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <Book className="h-12 w-12 text-green-800 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-3">Educational Reform</h4>
              <p className="text-gray-700 mb-4">
                Progressive education theory and practice for transformative learning.
              </p>
              <Button className="bg-green-600 hover:bg-green-700">
                Explore Collection
              </Button>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <Book className="h-12 w-12 text-blue-800 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-3">Historical Analysis</h4>
              <p className="text-gray-700 mb-4">
                Critical examination of historical events from a people's perspective.
              </p>
              <Button className="bg-green-600 hover:bg-green-700">
                Explore Collection
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
