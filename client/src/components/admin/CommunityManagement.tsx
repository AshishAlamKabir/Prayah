import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Eye, Check, X, Clock, FileText, Image, Calendar, Users, Trash2 } from "lucide-react";

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

const categories = [
  { value: "education", label: "Education & Learning" },
  { value: "culture", label: "Arts & Culture" },
  { value: "community", label: "Community Events" },
  { value: "achievement", label: "Achievements" },
  { value: "news", label: "News & Updates" },
  { value: "other", label: "Other" }
];

export default function CommunityManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  // Fetch posts by status
  const { data: pendingPosts = [], isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/community-posts", "pending"],
    queryFn: () => apiRequest("GET", "/api/community-posts?status=pending").then(res => res.json())
  });

  const { data: approvedPosts = [], isLoading: approvedLoading } = useQuery({
    queryKey: ["/api/community-posts", "approved"],
    queryFn: () => apiRequest("GET", "/api/community-posts?status=approved").then(res => res.json())
  });

  const { data: rejectedPosts = [], isLoading: rejectedLoading } = useQuery({
    queryKey: ["/api/community-posts", "rejected"],
    queryFn: () => apiRequest("GET", "/api/community-posts?status=rejected").then(res => res.json())
  });

  // Update post status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ postId, status, reason }: { postId: number; status: string; reason?: string }) => {
      return await apiRequest("PATCH", `/api/community-posts/${postId}/status`, { status, rejectionReason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-posts"] });
      toast({
        title: "Success",
        description: "Post status updated successfully",
      });
      setSelectedPost(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update post status",
        variant: "destructive",
      });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return await apiRequest("DELETE", `/api/community-posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-posts"] });
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (postId: number) => {
    updateStatusMutation.mutate({ postId, status: "approved" });
  };

  const handleReject = (postId: number, reason: string) => {
    updateStatusMutation.mutate({ postId, status: "rejected", reason });
  };

  const handleDelete = (postId: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(postId);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "education": return <FileText className="w-4 h-4" />;
      case "culture": return <FileText className="w-4 h-4" />;
      case "community": return <Users className="w-4 h-4" />;
      case "achievement": return <FileText className="w-4 h-4" />;
      case "news": return <Calendar className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="text-green-600 border-green-600"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-600 border-red-600"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const PostCard = ({ post }: { post: CommunityPost }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {getCategoryIcon(post.category)}
            <Badge variant="outline" className="text-xs">
              {categories.find(c => c.value === post.category)?.label || post.category}
            </Badge>
          </div>
          {getStatusBadge(post.status)}
        </div>
        <CardTitle className="text-lg">{post.title}</CardTitle>
        <p className="text-sm text-gray-600">
          By {post.authorName} ({post.authorEmail}) • {new Date(post.createdAt).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 text-sm mb-3 line-clamp-3">
          {post.content}
        </p>
        
        {post.mediaFiles && post.mediaFiles.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Image className="w-3 h-3" />
            {post.mediaFiles.length} media file{post.mediaFiles.length > 1 ? 's' : ''}
          </div>
        )}
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{post.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {post.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
            <p className="text-xs text-red-700">
              <strong>Rejection Reason:</strong> {post.rejectionReason}
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setSelectedPost(post)}>
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{post.title}</DialogTitle>
                <DialogDescription>
                  View complete details of this community post including content, media, and metadata.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    By {post.authorName} ({post.authorEmail}) • {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    {getCategoryIcon(post.category)}
                    <Badge variant="outline">
                      {categories.find(c => c.value === post.category)?.label || post.category}
                    </Badge>
                    {getStatusBadge(post.status)}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Content:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                </div>
                
                {post.mediaFiles && post.mediaFiles.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Media Files:</h4>
                    <div className="space-y-2">
                      {post.mediaFiles.map((file, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                          <a
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 break-all"
                          >
                            {file}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {post.tags && post.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {post.status === "pending" && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(post.id)}
                      disabled={updateStatusMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive">
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Post</DialogTitle>
                          <DialogDescription>
                            Provide a reason for rejecting this community post. This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Reason for rejection:</label>
                            <Textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Please provide a reason for rejection..."
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                handleReject(post.id, rejectionReason);
                                setRejectionReason("");
                              }}
                              disabled={updateStatusMutation.isPending || !rejectionReason.trim()}
                              variant="destructive"
                            >
                              Reject Post
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {post.status !== "pending" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(post.id)}
              disabled={deletePostMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Community Posts Management</h2>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-yellow-600">
            {pendingPosts.length} Pending
          </Badge>
          <Badge variant="outline" className="text-green-600">
            {approvedPosts.length} Approved
          </Badge>
          <Badge variant="outline" className="text-red-600">
            {rejectedPosts.length} Rejected
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review ({pendingPosts.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedPosts.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
            </div>
          ) : pendingPosts.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-600">No Pending Posts</h3>
                <p className="text-gray-500">All community posts have been reviewed.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingPosts.map((post: CommunityPost) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
            </div>
          ) : approvedPosts.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Check className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-600">No Approved Posts</h3>
                <p className="text-gray-500">No posts have been approved yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvedPosts.map((post: CommunityPost) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full" />
            </div>
          ) : rejectedPosts.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <X className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-600">No Rejected Posts</h3>
                <p className="text-gray-500">No posts have been rejected.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rejectedPosts.map((post: CommunityPost) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}