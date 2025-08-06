import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ArrowLeft } from "lucide-react";

export default function TestBookForm() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");

  console.log("TestBookForm rendered, showForm:", showForm);

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-red-800">Add New Book</h1>
          <Button
            onClick={() => {
              console.log("Back button clicked");
              setShowForm(false);
            }}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Book Information Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Book Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title"
              />
            </div>

            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
              />
            </div>

            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                type="number"
              />
            </div>

            <div className="flex gap-4">
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  console.log("Add Book clicked", { title, author, price });
                  alert(`Book added: ${title} by ${author} - ₹${price}`);
                  setTitle("");
                  setAuthor("");
                  setPrice("");
                  setShowForm(false);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Book to Store
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  setTitle("");
                  setAuthor("");
                  setPrice("");
                }}
              >
                Clear Form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-red-800">Book Management - Test Version</h1>
        <Button
          onClick={() => {
            console.log("Add New Book button clicked in test component");
            setShowForm(true);
          }}
          className="bg-red-800 hover:bg-red-900"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Book (TEST)
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Click the "Add New Book (TEST)" button above to test the form</p>
            <p className="text-sm text-gray-500">Current form state: {showForm ? "FORM VISIBLE" : "DASHBOARD VISIBLE"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}