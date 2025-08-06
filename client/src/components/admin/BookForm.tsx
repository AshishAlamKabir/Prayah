import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Book as BookIcon, 
  Upload, 
  ImageIcon, 
  FileText,
  Plus,
  X
} from "lucide-react";

interface BookFormData {
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
  bookType: string;
  quantity: number;
}

export default function BookForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<BookFormData>({
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
    bookType: "paperback",
    quantity: 0,
  });
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Add new book mutation
  const addBookMutation = useMutation({
    mutationFn: async (bookData: FormData) => {
      const response = await apiRequest("POST", "/api/admin/books", bookData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/book-stock"] });
      toast({
        title: "Success",
        description: "Book added successfully to the store!",
      });
      
      // Reset form
      setFormData({
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
        bookType: "paperback",
        quantity: 0,
      });
      setCoverImage(null);
      setPdfFile(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      console.error("Error adding book:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add book to store. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setCoverImage(file);
      
      // Create preview
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
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
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
    
    if (!formData.title || !formData.author || !formData.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (title, author, price).",
        variant: "destructive",
      });
      return;
    }

    if (!coverImage) {
      toast({
        title: "Missing Image",
        description: "Please upload a cover image for the book store.",
        variant: "destructive",
      });
      return;
    }

    // Create FormData for file upload
    const formDataToSend = new FormData();
    
    // Add all text fields
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-green-600" />
          Add New Book to Store
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
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
                <Label htmlFor="quantity">Initial Stock Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  placeholder="Enter initial stock quantity"
                />
              </div>

              <div>
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                  placeholder="Enter ISBN"
                />
              </div>
            </div>

            {/* Right Column - Images & Details */}
            <div className="space-y-4">
              {/* Cover Image Upload */}
              <div>
                <Label>Cover Image for Store *</Label>
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
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Upload book cover image</p>
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
                <p className="text-xs text-gray-500 mt-1">Recommended: 400x600px, max 5MB</p>
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
                <p className="text-xs text-gray-500 mt-1">For digital access, max 50MB</p>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter book description for store"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., education, culture, history"
                />
              </div>
            </div>
          </div>

          {/* Book Type & Options */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="bookType">Book Type *</Label>
              <Select
                value={formData.bookType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, bookType: value }))}
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

            <div className="flex gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                />
                <Label htmlFor="featured">Featured in Store</Label>
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
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={addBookMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {addBookMutation.isPending ? "Adding to Store..." : "Add to Book Store"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
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
                  bookType: "paperback",
                  quantity: 0,
                });
                setCoverImage(null);
                setPdfFile(null);
                setImagePreview(null);
              }}
            >
              Clear Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}