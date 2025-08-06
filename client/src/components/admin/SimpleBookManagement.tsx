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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Book as BookIcon, 
  Package, 
  Upload, 
  Plus, 
  ImageIcon, 
  FileText,
  TrendingUp,
  Users,
  Edit
} from "lucide-react";
import type { Book } from "@shared/schema";

interface BookFormData {
  title: string;
  author: string;
  editor: string;
  description: string;
  category: string;
  price: number;
  isbn: string;
  tags: string;
  subscriptionOnly: boolean;
  featured: boolean;
  bookType: string;
  quantity: number;
}

export default function SimpleBookManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  
  console.log("SimpleBookManagement rendered, showForm:", showForm);
  
  const [formData, setFormData] = useState<BookFormData>({
    title: "",
    author: "",
    editor: "",
    description: "",
    category: "",
    price: 0,
    isbn: "",
    tags: "",
    subscriptionOnly: false,
    featured: false,
    bookType: "paperback",
    quantity: 0,
  });
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch books and analytics
  const { data: books = [], isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: analytics } = useQuery<{
    totalBooks: number;
    totalStock: number;
    lowStockBooks: number;
  }>({
    queryKey: ["/api/admin/book-analytics"],
  });

  const { data: stockData = [] } = useQuery({
    queryKey: ["/api/admin/book-stock"],
  });

  // Add book mutation
  const addBookMutation = useMutation({
    mutationFn: async (bookData: FormData) => {
      console.log("Submitting book with form data");
      const response = await apiRequest("POST", "/api/admin/books", bookData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-analytics"] });
      
      toast({
        title: "Success!",
        description: "Book added successfully to the store",
      });
      
      // Reset form
      resetForm();
      setShowForm(false);
    },
    onError: (error: any) => {
      console.error("Error adding book:", error);
      toast({
        title: "Error",
        description: "Failed to add book. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      editor: "",
      description: "",
      category: "",
      price: 0,
      isbn: "",
      tags: "",
      subscriptionOnly: false,
      featured: false,
      bookType: "paperback",
      quantity: 0,
    });
    setCoverImage(null);
    setPdfFile(null);
    setImagePreview(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setCoverImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a PDF under 50MB",
          variant: "destructive",
        });
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");
    
    if (!formData.title || !formData.author || !formData.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, author, and price",
        variant: "destructive",
      });
      return;
    }

    if (!coverImage) {
      toast({
        title: "Missing Image",
        description: "Please upload a cover image",
        variant: "destructive",
      });
      return;
    }

    const formDataToSend = new FormData();
    
    // Add text fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'tags') {
        formDataToSend.append(key, JSON.stringify(value.split(",").map((tag: string) => tag.trim()).filter(Boolean)));
      } else {
        formDataToSend.append(key, value.toString());
      }
    });
    
    // Add files
    if (coverImage) {
      formDataToSend.append('coverImage', coverImage);
    }
    if (pdfFile) {
      formDataToSend.append('pdfFile', pdfFile);
    }

    addBookMutation.mutate(formDataToSend);
  };

  const categories = ["Education", "Culture", "Agriculture", "Activism", "History", "Literature", "Other"];

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-red-800">Add New Book</h1>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              setShowForm(false);
            }}
          >
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Book Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Book Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter book title"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                      placeholder="Enter author name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="Enter price"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
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
                    <Label htmlFor="quantity">Stock Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      placeholder="Enter stock quantity"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Cover Image Upload */}
                  <div>
                    <Label>Cover Image *</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Cover preview"
                            className="w-full h-48 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setCoverImage(null);
                              setImagePreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">Upload book cover</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="coverImageInput"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('coverImageInput')?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Image
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PDF Upload */}
                  <div>
                    <Label>PDF File (Optional)</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="hidden"
                        id="pdfInput"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('pdfInput')?.click()}
                        className="w-full"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {pdfFile ? pdfFile.name : "Upload PDF"}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter book description"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                  />
                  <Label htmlFor="featured">Featured Book</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="subscriptionOnly"
                    checked={formData.subscriptionOnly}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, subscriptionOnly: checked }))}
                  />
                  <Label htmlFor="subscriptionOnly">Subscription Only</Label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={addBookMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {addBookMutation.isPending ? "Adding Book..." : "Add Book to Store"}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Clear Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-red-800">Book Management</h1>
        <Button
          onClick={() => {
            console.log("Add New Book button clicked");
            setShowForm(true);
          }}
          className="bg-red-800 hover:bg-red-900"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Book
        </Button>
      </div>

      {/* Analytics Cards */}
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
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(books as Book[]).filter((book: Book) => book.featured).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Book Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-red-600" />
            Book Inventory ({(books as Book[]).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {booksLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading books...</p>
            </div>
          ) : (books as Book[]).length === 0 ? (
            <div className="text-center py-8">
              <BookIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No books in store yet</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Book
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(books as Book[]).map((book: Book) => (
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
    </div>
  );
}