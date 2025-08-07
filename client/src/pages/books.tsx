import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, Search, Download, Eye } from "lucide-react";
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
            Educational Library
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Explore our collection of educational books, publications, and resources for learning
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
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                          Educational
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{book.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">
                        by {book.author}
                        {book.contributorRole && book.contributorRole !== 'author' && (
                          <span className="text-gray-500"> • {book.contributorRole === 'editor' ? 'Editor' : 'Author & Editor'}</span>
                        )}
                        {book.editor && <span className="text-gray-500"> • edited by {book.editor}</span>}
                      </p>
                      <p className="text-gray-700 text-sm mb-4 line-clamp-3">{book.description}</p>
                      
                      {book.isbn && (
                        <p className="text-xs text-gray-500 mb-2">ISBN: {book.isbn}</p>
                      )}
                      
                      {book.publishedYear && (
                        <p className="text-xs text-gray-500 mb-4">Published: {book.publishedYear}</p>
                      )}
                      
                      <div className="flex gap-2">
                        {book.pdfUrl && (
                          <button 
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 flex-1"
                            onClick={() => window.open(book.pdfUrl!, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                            Read PDF
                          </button>
                        )}
                        <button 
                          className="border border-red-600 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded flex items-center justify-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </button>
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
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Educational Collections</h3>
            <p className="text-lg text-gray-600">
              Curated collections of educational and cultural literature
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-red-50 p-6 rounded-lg text-center">
              <Book className="h-12 w-12 text-red-800 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-3">Educational Theory</h4>
              <p className="text-gray-700 mb-4">
                Essential texts on educational philosophy, pedagogy, and learning theory.
              </p>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Explore Collection
              </button>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg text-center">
              <Book className="h-12 w-12 text-green-800 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-3">Cultural Studies</h4>
              <p className="text-gray-700 mb-4">
                Cultural heritage, arts, and community development resources.
              </p>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Explore Collection
              </button>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <Book className="h-12 w-12 text-blue-800 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-900 mb-3">Historical Research</h4>
              <p className="text-gray-700 mb-4">
                Historical analysis and research from academic perspectives.
              </p>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Explore Collection
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
