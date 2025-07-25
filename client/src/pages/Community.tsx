import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Upload, FileText, Image, Video, Music, Award, Users, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommunityPost {
  id: number;
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorEmail: string;
  userId?: number;
  mediaFiles: string[];
  tags: string[];
  status: string;
  approvedBy?: number;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface PostFormData {
  title: string;
  content: string;
  category: string;
  authorName: string;
  authorEmail: string;
  mediaFiles: string[];
  tags: string[];
}

const categories = [
  { value: "education", label: "Education & Learning" },
  { value: "culture", label: "Arts & Culture" },
  { value: "community", label: "Community Events" },
  { value: "achievement", label: "Achievements" },
  { value: "news", label: "News & Updates" },
  { value: "other", label: "Other" }
];

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PostFormData>({
    title: "",
    content: "",
    category: "",
    authorName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
    authorEmail: user?.email || "",
    mediaFiles: [],
    tags: []
  });
  const [mediaInput, setMediaInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Fetch approved community posts for display
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/community-posts", "approved"],
    queryFn: () => apiRequest("GET", "/api/community-posts?status=approved").then(res => res.json())
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: PostFormData) => {
      const response = await apiRequest("POST", "/api/community-posts", postData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-posts"] });
      toast({
        title: "Success",
        description: "Your post has been submitted for review. It will appear after admin approval.",
      });
      setShowForm(false);
      setFormData({
        title: "",
        content: "",
        category: "",
        authorName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
        authorEmail: user?.email || "",
        mediaFiles: [],
        tags: []
      });
      setMediaInput("");
      setTagInput("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.category || !formData.authorName || !formData.authorEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createPostMutation.mutate(formData);
  };

  const addMediaFile = () => {
    if (mediaInput.trim() && !formData.mediaFiles.includes(mediaInput.trim())) {
      setFormData(prev => ({
        ...prev,
        mediaFiles: [...prev.mediaFiles, mediaInput.trim()]
      }));
      setMediaInput("");
    }
  };

  const removeMediaFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "education": return <FileText className="w-4 h-4" />;
      case "culture": return <Music className="w-4 h-4" />;
      case "community": return <Users className="w-4 h-4" />;
      case "achievement": return <Award className="w-4 h-4" />;
      case "news": return <Calendar className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Community Space</h1>
          <p className="text-xl text-gray-600 mb-6">
            Share your achievements, ideas, and contributions with the Prayas community
          </p>
          
          {user && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {showForm ? "Cancel" : "Create New Post"}
            </Button>
          )}
        </div>

        {/* Submission Form */}
        {showForm && user && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Submit Your Content</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter post title"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="authorName">Your Name *</Label>
                    <Input
                      id="authorName"
                      value={formData.authorName}
                      onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="authorEmail">Your Email *</Label>
                    <Input
                      id="authorEmail"
                      type="email"
                      value={formData.authorEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, authorEmail: e.target.value }))}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your content here..."
                    rows={6}
                    required
                  />
                </div>

                {/* Media Files Section */}
                <div>
                  <Label>Media Files (Images, Videos, Documents)</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={mediaInput}
                      onChange={(e) => setMediaInput(e.target.value)}
                      placeholder="Enter media file URL"
                    />
                    <Button type="button" onClick={addMediaFile} variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  
                  {formData.mediaFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {formData.mediaFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm truncate flex-1">{file}</span>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeMediaFile(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags Section */}
                <div>
                  <Label>Tags (Optional)</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Enter a tag"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      Add Tag
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(index)}>
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createPostMutation.isPending ? "Submitting..." : "Submit for Review"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Community Posts Display */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Community Posts Yet</h3>
                <p className="text-gray-500">
                  Be the first to share something with the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {posts.map((post: CommunityPost) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(post.category)}
                        <div>
                          <CardTitle className="text-xl">{post.title}</CardTitle>
                          <p className="text-sm text-gray-600">
                            By {post.authorName} • {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {categories.find(c => c.value === post.category)?.label || post.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                    </div>
                    
                    {/* Media Files */}
                    {post.mediaFiles && post.mediaFiles.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          Attached Media
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {post.mediaFiles.map((file, index) => (
                            <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                              <a
                                href={file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 truncate block"
                              >
                                {file}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {!user && (
          <Card className="mt-8 text-center">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold mb-2">Want to Share Something?</h3>
              <p className="text-gray-600 mb-4">
                Please log in to submit your content to the community.
              </p>
              <Button className="bg-red-600 hover:bg-red-700">
                <a href="/login">Log In</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}