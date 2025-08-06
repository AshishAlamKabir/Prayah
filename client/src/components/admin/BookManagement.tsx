import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BookForm from "./BookForm";
import { 
  Book as BookIcon, 
  Package, 
  TrendingUp,
  Users
} from "lucide-react";
import type { Book } from "@shared/schema";

export default function BookManagement() {
  // Fetch books for display and analytics
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ["/api/books"],
  });

  // Fetch book analytics
  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/book-analytics"],
  });

  // Fetch stock information
  const { data: stockData = [] } = useQuery({
    queryKey: ["/api/admin/book-stock"],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-red-800">Book Store Management</h1>
      </div>

      <Tabs defaultValue="add" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="add">Add New Book</TabsTrigger>
          <TabsTrigger value="inventory">Book Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-6">
          <BookForm />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-red-600" />
                Book Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {booksLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading books...</p>
                </div>
              ) : books.length === 0 ? (
                <div className="text-center py-8">
                  <BookIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No books in store yet. Add your first book!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {books.map((book: Book) => (
                    <Card key={book.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {book.imageUrl ? (
                            <img
                              src={book.imageUrl}
                              alt={book.title}
                              className="w-16 h-20 object-cover rounded border"
                            />
                          ) : (
                            <div className="w-16 h-20 bg-gray-200 rounded border flex items-center justify-center">
                              <BookIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{book.title}</h3>
                            <p className="text-xs text-gray-600 truncate">by {book.author}</p>
                            <p className="text-sm font-medium text-green-600 mt-1">₹{book.price}</p>
                            <div className="flex gap-1 mt-2">
                              {book.featured && (
                                <Badge variant="secondary" className="text-xs">Featured</Badge>
                              )}
                              {book.subscriptionOnly && (
                                <Badge variant="outline" className="text-xs">Premium</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Books</p>
                    <p className="text-2xl font-bold text-red-800">
                      {analytics?.totalBooks || 0}
                    </p>
                  </div>
                  <BookIcon className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Stock</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics?.totalStock || 0}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Low Stock</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {analytics?.lowStockBooks || 0}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Featured Books</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {books.filter((book: Book) => book.featured).length}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {stockData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Stock Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stockData.slice(0, 5).map((stock: any) => (
                    <div key={stock.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">{stock.bookTitle}</p>
                        <p className="text-sm text-gray-600">
                          Updated by {stock.updatedByName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Qty: {stock.quantity}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(stock.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}