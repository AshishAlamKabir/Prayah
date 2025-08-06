import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowLeft, Upload } from "lucide-react";

export default function BookManager() {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddBook = async (formData: FormData) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/books', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Book added to store successfully!"
        });
        setShowAddForm(false);
        // Reset form would happen here
      } else {
        throw new Error('Failed to add book');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add book. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-red-800">Add New Book</h1>
          <Button
            variant="outline"
            onClick={() => setShowAddForm(false)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Book Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              // Validation
              const title = formData.get('title') as string;
              const author = formData.get('author') as string;
              const price = formData.get('price') as string;
              const coverImage = formData.get('coverImage') as File;
              
              if (!title || !author || !price) {
                toast({
                  title: "Missing Information",
                  description: "Please fill in title, author, and price",
                  variant: "destructive"
                });
                return;
              }
              
              if (!coverImage || coverImage.size === 0) {
                toast({
                  title: "Missing Image",
                  description: "Please upload a cover image",
                  variant: "destructive"
                });
                return;
              }
              
              // Add default values
              formData.set('subscriptionOnly', 'false');
              formData.set('featured', 'false');
              formData.set('bookType', 'paperback');
              formData.set('tags', JSON.stringify([]));
              
              handleAddBook(formData);
            }} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Enter book title"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      name="author"
                      placeholder="Enter author name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      placeholder="e.g., Education, Culture"
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Stock</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                      defaultValue="0"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="coverImage">Cover Image *</Label>
                    <Input
                      id="coverImage"
                      name="coverImage"
                      type="file"
                      accept="image/*"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Book description..."
                      rows={8}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? "Adding..." : "Add Book"}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const form = document.querySelector('form') as HTMLFormElement;
                    form?.reset();
                  }}
                >
                  Clear
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
          onClick={() => setShowAddForm(true)}
          className="bg-red-800 hover:bg-red-900"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Book
        </Button>
      </div>

      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Add Books to Your Store
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start building your book catalog. Add books with cover images, descriptions, 
              and pricing to make them available in your public store.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Book
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}