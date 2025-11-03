import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  Star,
  Eye,
  Download,
  Upload
} from "lucide-react";

interface Book {
  id: number;
  title: string;
  author: string;
  price: string;
  category: string;
  imageUrl?: string;
  pdfUrl?: string;
  featured: boolean;
  tags: string[];
  description: string;
  isbn?: string;
  publishedYear?: number;
  bookType: string;
  createdAt: string;
  updatedAt: string;
}

interface BookStock {
  bookId: number;
  quantity: number;
  reserved: number;
  available: number;
  book: Book;
}

interface BookAnalytics {
  totalBooks: number;
  featuredBooks: number;
  totalCategories: number;
  recentlyAdded: number;
  topSellingBooks: Array<{
    bookId: number;
    title: string;
    totalSold: number;
  }>;
  lowStockBooks: Array<{
    bookId: number;
    title: string;
    quantity: number;
  }>;
}

export default function BookManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddBookDialogOpen, setIsAddBookDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    imageUrl: "",
    pdfUrl: "",
    featured: false,
    tags: "",
    isbn: "",
    publishedYear: "",
    bookType: "paperback"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch books
  const { data: books = [], isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
    staleTime: 0, // Always get fresh data for admin
    refetchOnMount: true,
  });

  // Fetch book analytics (super admin only)
  const { data: analytics, isLoading: analyticsLoading } = useQuery<BookAnalytics>({
    queryKey: ["/api/admin/book-analytics"],
  });

  // Fetch book stock (super admin only)
  const { data: bookStock = [], isLoading: stockLoading } = useQuery<BookStock[]>({
    queryKey: ["/api/admin/book-stock"],
  });

  // Add book mutation
  const addBookMutation = useMutation({
    mutationFn: async (bookData: any) => {
      const tagsArray = bookData.tags ? bookData.tags.split(',').map((tag: string) => tag.trim()) : [];
      return apiRequest("POST", "/api/admin/books", {
        ...bookData,
        tags: tagsArray,
        price: parseFloat(bookData.price),
        stock: parseInt(bookData.stock) || 0,
        publishedYear: bookData.publishedYear ? parseInt(bookData.publishedYear) : null
      });
    },
    onSuccess: () => {
      // Force immediate cache invalidation for book additions
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-stock"] });
      
      // Force refetch to ensure immediate update
      queryClient.refetchQueries({ queryKey: ["/api/books"] });
      queryClient.refetchQueries({ queryKey: ['/api/books'] });
      
      setIsAddBookDialogOpen(false);
      setNewBook({
        title: "",
        author: "",
        description: "",
        category: "",
        price: "",
        stock: "",
        imageUrl: "",
        pdfUrl: "",
        featured: false,
        tags: "",
        isbn: "",
        publishedYear: "",
        bookType: "paperback"
      });
      toast({
        title: "Success",
        description: "Book added successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add book",
        variant: "destructive"
      });
    }
  });

  // Update book mutation
  const updateBookMutation = useMutation({
    mutationFn: async ({ bookId, bookData }: { bookId: number; bookData: any }) => {
      const tagsArray = bookData.tags ? bookData.tags.split(',').map((tag: string) => tag.trim()) : [];
      return apiRequest("PATCH", `/api/admin/books/${bookId}`, {
        ...bookData,
        tags: tagsArray,
        price: parseFloat(bookData.price),
        publishedYear: bookData.publishedYear ? parseInt(bookData.publishedYear) : null
      });
    },
    onSuccess: () => {
      // Force immediate cache invalidation for book updates
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-analytics"] });
      
      // Force refetch to ensure immediate update
      queryClient.refetchQueries({ queryKey: ["/api/books"] });
      queryClient.refetchQueries({ queryKey: ['/api/books'] });
      
      setEditingBook(null);
      toast({
        title: "Success",
        description: "Book updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update book",
        variant: "destructive"
      });
    }
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      return apiRequest("DELETE", `/api/admin/books/${bookId}`);
    },
    onSuccess: (_, bookId) => {
      // Immediately update cache data manually to remove the deleted book
      queryClient.setQueryData(["/api/books"], (oldData: Book[] | undefined) => {
        return oldData ? oldData.filter(book => book.id !== bookId) : [];
      });
      
      // Force immediate cache invalidation with exact and broad patterns
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-stock"] });
      
      // Also remove all cached data immediately and refetch
      queryClient.removeQueries({ queryKey: ["/api/books"] });
      queryClient.removeQueries({ queryKey: ['/api/books'] });
      queryClient.refetchQueries({ queryKey: ["/api/books"] });
      queryClient.refetchQueries({ queryKey: ['/api/books'] });
      
      toast({
        title: "Success",
        description: "Book deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete book",
        variant: "destructive"
      });
    }
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ bookId, quantity }: { bookId: number; quantity: number }) => {
      return apiRequest("PATCH", `/api/admin/books/${bookId}/stock`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] }); // Refresh main books data
      toast({
        title: "Success",
        description: "Stock updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update stock",
        variant: "destructive"
      });
    }
  });

  const handleAddBook = () => {
    addBookMutation.mutate(newBook);
  };

  const handleUpdateBook = () => {
    if (editingBook) {
      updateBookMutation.mutate({
        bookId: editingBook.id,
        bookData: {
          title: editingBook.title,
          author: editingBook.author,
          description: editingBook.description,
          category: editingBook.category,
          price: editingBook.price,
          imageUrl: editingBook.imageUrl,
          pdfUrl: editingBook.pdfUrl,
          featured: editingBook.featured,
          tags: editingBook.tags.join(', '),
          isbn: editingBook.isbn,
          publishedYear: editingBook.publishedYear?.toString() || "",
          bookType: editingBook.bookType
        }
      });
    }
  };

  const BookForm = ({ book, onUpdate, isEditing = false }: {
    book: any;
    onUpdate: (field: string, value: any) => void;
    isEditing?: boolean;
  }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={book.title}
            onChange={(e) => onUpdate('title', e.target.value)}
            placeholder="Book title"
          />
        </div>
        <div>
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={book.author}
            onChange={(e) => onUpdate('author', e.target.value)}
            placeholder="Author name"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={book.description}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Book description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={book.category}
            onChange={(e) => onUpdate('category', e.target.value)}
            placeholder="Book category"
            data-testid="input-category"
          />
        </div>
        <div>
          <Label htmlFor="price">Price (₹)</Label>
          <Input
            id="price"
            type="number"
            value={book.price}
            onChange={(e) => onUpdate('price', e.target.value)}
            placeholder="0.00"
            data-testid="input-price"
          />
        </div>
        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            value={book.stock || ''}
            onChange={(e) => onUpdate('stock', e.target.value)}
            placeholder="0"
            data-testid="input-stock"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="isbn">ISBN</Label>
          <Input
            id="isbn"
            value={book.isbn || ''}
            onChange={(e) => onUpdate('isbn', e.target.value)}
            placeholder="ISBN number"
          />
        </div>
        <div>
          <Label htmlFor="publishedYear">Published Year</Label>
          <Input
            id="publishedYear"
            type="number"
            value={book.publishedYear || ''}
            onChange={(e) => onUpdate('publishedYear', e.target.value)}
            placeholder="2024"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bookType">Book Type</Label>
          <Select value={book.bookType} onValueChange={(value) => onUpdate('bookType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paperback">Paperback</SelectItem>
              <SelectItem value="hardcover">Hardcover</SelectItem>
              <SelectItem value="ebook">E-book</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="featured"
            checked={book.featured}
            onChange={(e) => onUpdate('featured', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="featured">Featured Book</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          value={isEditing ? book.tags?.join(', ') || '' : book.tags}
          onChange={(e) => onUpdate('tags', e.target.value)}
          placeholder="fiction, mystery, bestseller"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={book.imageUrl || ''}
            onChange={(e) => onUpdate('imageUrl', e.target.value)}
            placeholder="https://example.com/book-cover.jpg"
          />
        </div>
        <div>
          <Label htmlFor="pdfUrl">PDF URL</Label>
          <Input
            id="pdfUrl"
            value={book.pdfUrl || ''}
            onChange={(e) => onUpdate('pdfUrl', e.target.value)}
            placeholder="https://example.com/book.pdf"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Book Management</h2>
          <p className="text-gray-600">Manage your book inventory, pricing, and content</p>
        </div>
        <Dialog open={isAddBookDialogOpen} onOpenChange={setIsAddBookDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Book
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Book</DialogTitle>
              <DialogDescription>
                Add a new book to your inventory
              </DialogDescription>
            </DialogHeader>
            <BookForm
              book={newBook}
              onUpdate={(field, value) => setNewBook(prev => ({ ...prev, [field]: value }))}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddBookDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddBook}
                disabled={addBookMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {addBookMutation.isPending ? "Adding..." : "Add Book"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4">Overview</TabsTrigger>
          <TabsTrigger value="books" className="text-xs sm:text-sm px-2 sm:px-4">Books</TabsTrigger>
          <TabsTrigger value="stock" className="text-xs sm:text-sm px-2 sm:px-4">Stock</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 sm:px-4">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Books</p>
                      <p className="text-2xl font-bold">{analytics.totalBooks}</p>
                    </div>
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Featured Books</p>
                      <p className="text-2xl font-bold">{analytics.featuredBooks}</p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Categories</p>
                      <p className="text-2xl font-bold">{analytics.totalCategories}</p>
                    </div>
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Recently Added</p>
                      <p className="text-2xl font-bold">{analytics.recentlyAdded}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {(analytics?.lowStockBooks || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Low Stock Alert
                </CardTitle>
                <CardDescription>Books that need restocking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(analytics?.lowStockBooks || []).map((book) => (
                    <div key={book.bookId} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium">{book.title}</span>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        {book.quantity} left
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="books" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Books</CardTitle>
              <CardDescription>Manage your book catalog</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {books.map((book: Book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.category}</TableCell>
                      <TableCell>₹{book.price}</TableCell>
                      <TableCell>
                        {book.featured ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBook(book)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBookMutation.mutate(book.id)}
                            disabled={deleteBookMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Management</CardTitle>
              <CardDescription>Monitor and update book inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Total Quantity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookStock.map((stock) => (
                    <TableRow key={stock.bookId}>
                      <TableCell className="font-medium">{stock.book.title}</TableCell>
                      <TableCell>
                        <Badge variant={stock.available < 5 ? "destructive" : "secondary"}>
                          {stock.available}
                        </Badge>
                      </TableCell>
                      <TableCell>{stock.reserved}</TableCell>
                      <TableCell>{stock.quantity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            className="w-20"
                            placeholder="Qty"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const target = e.target as HTMLInputElement;
                                const quantity = parseInt(target.value);
                                if (quantity && quantity > 0) {
                                  updateStockMutation.mutate({
                                    bookId: stock.bookId,
                                    quantity
                                  });
                                  target.value = '';
                                }
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              const quantity = parseInt(input.value);
                              if (quantity && quantity > 0) {
                                updateStockMutation.mutate({
                                  bookId: stock.bookId,
                                  quantity
                                });
                                input.value = '';
                              }
                            }}
                          >
                            Update
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Books</CardTitle>
                  <CardDescription>Best performing books in your store</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analytics?.topSellingBooks || []).map((book, index) => (
                      <div key={book.bookId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{book.title}</span>
                        </div>
                        <Badge>{book.totalSold} sold</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Book Dialog */}
      <Dialog open={!!editingBook} onOpenChange={() => setEditingBook(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>
              Update book information
            </DialogDescription>
          </DialogHeader>
          {editingBook && (
            <BookForm
              book={editingBook}
              onUpdate={(field, value) => setEditingBook(prev => prev ? { ...prev, [field]: value } : null)}
              isEditing={true}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBook(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateBook}
              disabled={updateBookMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {updateBookMutation.isPending ? "Updating..." : "Update Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}