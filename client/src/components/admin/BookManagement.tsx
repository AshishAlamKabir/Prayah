import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Book as BookIcon, 
  Package, 
  Upload, 
  Edit3, 
  Trash2, 
  Plus, 
  ImageIcon, 
  FileText,
  TrendingUp,
  Users
} from "lucide-react";
import type { Book } from "@shared/schema";

interface BookStock {
  id: number;
  bookId: number;
  quantity: number;
  lastUpdated: string;
  updatedBy: number;
  book: {
    id: number;
    title: string;
    author: string;
    price: string;
    imageUrl: string | null;
    inStock: boolean;
  };
}

interface NewBookForm {
  title: string;
  author: string;
  editor: string;
  contributorRole: string;
  description: string;
  category: string;
  price: number;
  isbn: string;
  tags: string;
  subscriptionOnly: boolean;
  featured: boolean;
  imageUrl: string;
  pdfUrl: string;
  bookType: string;
  quantity: number;
}

export default function BookManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("stock");
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBookForm, setNewBookForm] = useState<NewBookForm>({
    title: "",
    author: "",
    editor: "",
    contributorRole: "author",
    description: "",
    category: "",
    price: 0,
    isbn: "",
    tags: "",
    subscriptionOnly: false,
    featured: false,
    imageUrl: "",
    bookType: "paperback",
    pdfUrl: "",
    quantity: 0,
  });
  
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Fetch book stock data
  const { data: bookStock = [], isLoading: stockLoading } = useQuery<BookStock[]>({
    queryKey: ["/api/admin/book-stock"],
  });

  // Fetch all books
  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ["/api/books"],
  });

  // Add new book mutation
  const addBookMutation = useMutation({
    mutationFn: async (bookData: any) => {
      return await apiRequest("POST", "/api/admin/books", bookData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-stock"] });
      toast({
        title: "Success",
        description: "Book added successfully!",
      });
      setIsAddingBook(false);
      setNewBookForm({
        title: "",
        author: "",
        editor: "",
        contributorRole: "author",
        description: "",
        category: "",
        price: 0,
        isbn: "",
        tags: "",
        subscriptionOnly: false,
        featured: false,
        imageUrl: "",
        pdfUrl: "",
        bookType: "paperback",
        quantity: 0,
      });
      setCoverImageFile(null);
      setPdfFile(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add book. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ bookId, quantity }: { bookId: number; quantity: number }) => {
      return await apiRequest("POST", "/api/admin/book-stock", { bookId, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-stock"] });
      toast({
        title: "Success",
        description: "Stock updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddBook = async () => {
    if (!newBookForm.title || !newBookForm.author || !newBookForm.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (title, author, price).",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = newBookForm.imageUrl;
      let pdfUrl = newBookForm.pdfUrl;

      // Upload files if they exist
      if (coverImageFile || pdfFile) {
        const formData = new FormData();
        if (coverImageFile) {
          formData.append('coverImage', coverImageFile);
        }
        if (pdfFile) {
          formData.append('pdfFile', pdfFile);
        }

        const uploadResponse = await apiRequest("POST", "/api/upload", formData);
        const uploadData = await uploadResponse.json();
        if (uploadData.coverImageUrl) {
          imageUrl = uploadData.coverImageUrl;
        }
        if (uploadData.pdfUrl) {
          pdfUrl = uploadData.pdfUrl;
        }
      }

      const bookData = {
        ...newBookForm,
        imageUrl,
        pdfUrl,
        isbn: newBookForm.isbn,
        tags: newBookForm.tags.split(",").map(tag => tag.trim()).filter(Boolean),
        price: parseFloat(newBookForm.price.toString()),
      };

      addBookMutation.mutate(bookData);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStockUpdate = (bookId: number, newQuantity: number) => {
    updateStockMutation.mutate({ bookId, quantity: newQuantity });
  };

  const categories = ["Education", "Culture", "Agriculture", "Activism", "History", "Literature", "Other"];

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stock">Stock Management</TabsTrigger>
          <TabsTrigger value="add">Add New Book</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Book Stock Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded mb-2"></div>
                    </div>
                  ))}
                </div>
              ) : bookStock.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No book stock records found. Add some books to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookStock.map((stock) => (
                    <div key={stock.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        {stock.book.imageUrl ? (
                          <img
                            src={stock.book.imageUrl}
                            alt={stock.book.title}
                            className="w-16 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-20 bg-gray-200 rounded flex items-center justify-center">
                            <BookIcon className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{stock.book.title}</h3>
                          <p className="text-sm text-gray-600">{stock.book.author}</p>
                          <p className="text-sm font-medium text-green-600">₹{stock.book.price}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Current Stock</p>
                          <Badge variant={stock.quantity > 0 ? "default" : "destructive"}>
                            {stock.quantity}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            min="0"
                            className="w-20"
                            placeholder="Qty"
                            id={`stock-input-${stock.bookId}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const newQty = parseInt((e.target as HTMLInputElement).value);
                                if (!isNaN(newQty)) {
                                  handleStockUpdate(stock.bookId, newQty);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById(`stock-input-${stock.bookId}`) as HTMLInputElement;
                              const newQty = parseInt(input?.value || '0');
                              if (!isNaN(newQty)) {
                                handleStockUpdate(stock.bookId, newQty);
                                input.value = '';
                              }
                            }}
                            disabled={updateStockMutation.isPending}
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Add New Book
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newBookForm.title}
                      onChange={(e) => setNewBookForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter book title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      value={newBookForm.author}
                      onChange={(e) => setNewBookForm(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Enter author name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contributorRole">Your Role</Label>
                    <Select
                      value={newBookForm.contributorRole}
                      onValueChange={(value) => setNewBookForm(prev => ({ ...prev, contributorRole: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="author">Author</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="author-editor">Author & Editor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="editor">Editor Name</Label>
                    <Input
                      id="editor"
                      value={newBookForm.editor}
                      onChange={(e) => setNewBookForm(prev => ({ ...prev, editor: e.target.value }))}
                      placeholder="Enter editor name (optional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newBookForm.category}
                      onValueChange={(value) => setNewBookForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newBookForm.price}
                      onChange={(e) => setNewBookForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="Enter price"
                    />
                  </div>

                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={newBookForm.isbn}
                      onChange={(e) => setNewBookForm(prev => ({ ...prev, isbn: e.target.value }))}
                      placeholder="Enter ISBN"
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Initial Stock Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={newBookForm.quantity}
                      onChange={(e) => setNewBookForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter initial stock quantity"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newBookForm.description}
                      onChange={(e) => setNewBookForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter book description"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={newBookForm.tags}
                      onChange={(e) => setNewBookForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="e.g., education, culture, history"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bookType">Book Type *</Label>
                    <Select
                      value={newBookForm.bookType}
                      onValueChange={(value) => setNewBookForm(prev => ({ ...prev, bookType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select book type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paperback">Paperback Only</SelectItem>
                        <SelectItem value="pdf">PDF Only</SelectItem>
                        <SelectItem value="both">Both Paperback & PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="coverImage">Cover Image</Label>
                    <div className="space-y-2">
                      <Input
                        id="coverImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCoverImageFile(file);
                            // Create preview URL
                            const previewUrl = URL.createObjectURL(file);
                            setNewBookForm(prev => ({ ...prev, imageUrl: previewUrl }));
                          }
                        }}
                      />
                      {coverImageFile && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <ImageIcon className="w-4 h-4" />
                          <span>{coverImageFile.name}</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">Upload an image file for the book cover</p>
                    </div>
                  </div>

                  {(newBookForm.bookType === 'pdf' || newBookForm.bookType === 'both') && (
                    <div>
                      <Label htmlFor="pdfFile">PDF File</Label>
                      <div className="space-y-2">
                        <Input
                          id="pdfFile"
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPdfFile(file);
                            }
                          }}
                        />
                        {pdfFile && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText className="w-4 h-4" />
                            <span>{pdfFile.name}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500">Upload a PDF file for digital access</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={newBookForm.featured}
                        onCheckedChange={(checked) => setNewBookForm(prev => ({ ...prev, featured: checked }))}
                      />
                      <Label htmlFor="featured">Featured Book</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="subscriptionOnly"
                        checked={newBookForm.subscriptionOnly}
                        onCheckedChange={(checked) => setNewBookForm(prev => ({ ...prev, subscriptionOnly: checked }))}
                      />
                      <Label htmlFor="subscriptionOnly">Subscription Only</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  onClick={handleAddBook}
                  disabled={addBookMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {addBookMutation.isPending ? "Adding Book..." : "Add Book"}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewBookForm({
                      title: "",
                      author: "",
                      editor: "",
                      contributorRole: "author",
                      description: "",
                      category: "",
                      price: 0,
                      isbn: "",
                      tags: "",
                      subscriptionOnly: false,
                      featured: false,
                      imageUrl: "",
                      pdfUrl: "",
                      bookType: "paperback",
                      quantity: 0,
                    });
                    setCoverImageFile(null);
                    setPdfFile(null);
                  }}
                >
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Books</p>
                    <p className="text-2xl font-bold">{Array.isArray(books) ? books.length : 0}</p>
                  </div>
                  <BookIcon className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Stock</p>
                    <p className="text-2xl font-bold text-green-600">
                      {bookStock.filter(s => s.quantity > 0).length}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Out of Stock</p>
                    <p className="text-2xl font-bold text-red-600">
                      {bookStock.filter(s => s.quantity === 0).length}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stock Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookStock.map((stock) => (
                  <div key={stock.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${stock.quantity > 10 ? 'bg-green-500' : stock.quantity > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      <span className="font-medium">{stock.book.title}</span>
                    </div>
                    <Badge variant={stock.quantity > 0 ? "default" : "destructive"}>
                      {stock.quantity} units
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}