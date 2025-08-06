import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, Users, FileText, BarChart3, Eye } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BookManager from "@/components/admin/BookManager";
import type { CommunityPost } from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("posts");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: pendingPosts, isLoading: postsLoading } = useQuery<CommunityPost[]>({
    queryKey: ["/api/community-posts"],
    queryFn: () => fetch("/api/community-posts?status=pending").then(res => res.json()),
  });

  const { data: allPosts, isLoading: allPostsLoading } = useQuery<CommunityPost[]>({
    queryKey: ["/api/community-posts", "all"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/community-posts/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-posts"] });
      toast({
        title: "Success",
        description: "Post status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update post status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/community-posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community-posts"] });
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleDeletePost = (id: number) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "pending":
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-red-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Admin Dashboard
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Comprehensive content moderation and platform management system
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="revolutionary-card bg-white p-6">
                  <Skeleton className="h-8 w-8 mb-2" />
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </Card>
              ))
            ) : (
              <>
                <Card className="revolutionary-card bg-white p-6 text-center">
                  <Users className="h-8 w-8 text-red-800 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-red-800 mb-2">{(stats as any)?.totalUsers || 0}</div>
                  <div className="text-gray-600">Total Users</div>
                </Card>
                <Card className="revolutionary-card bg-white p-6 text-center">
                  <FileText className="h-8 w-8 text-red-800 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-red-800 mb-2">{(stats as any)?.totalPosts || 0}</div>
                  <div className="text-gray-600">Community Posts</div>
                </Card>
                <Card className="revolutionary-card bg-white p-6 text-center">
                  <BarChart3 className="h-8 w-8 text-red-800 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-red-800 mb-2">{(stats as any)?.totalSchools || 0}</div>
                  <div className="text-gray-600">Active Schools</div>
                </Card>
                <Card className="revolutionary-card bg-white p-6 text-center">
                  <Clock className="h-8 w-8 text-red-800 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-red-800 mb-2">{pendingPosts?.length || 0}</div>
                  <div className="text-gray-600">Pending Reviews</div>
                </Card>
              </>
            )}
          </div>

          {/* Main Admin Interface */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posts">Publications</TabsTrigger>
              <TabsTrigger value="books">Book Management</TabsTrigger>
              <TabsTrigger value="content">Content Management</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Publication Approval Management</h3>
                <p className="text-gray-600">Approve or reject publications submitted by the community and manage published works.</p>
              </div>
              <div className="grid gap-6">
                {/* Pending Posts Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      Pending Review ({pendingPosts?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {postsLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="border rounded-lg p-4">
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-16 w-full mb-4" />
                            <div className="flex gap-2">
                              <Skeleton className="h-10 w-20" />
                              <Skeleton className="h-10 w-20" />
                              <Skeleton className="h-10 w-20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : pendingPosts && pendingPosts.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                        <p className="text-gray-600">No posts are currently pending review.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingPosts?.map((post) => (
                          <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                              {getStatusBadge(post.status || "pending")}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">{post.authorName}</span> • {post.authorEmail} • {post.category}
                            </div>
                            <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleStatusUpdate(post.id, "approved")}
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleStatusUpdate(post.id, "rejected")}
                                disabled={updateStatusMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePost(post.id)}
                                disabled={deletePostMutation.isPending}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* All Posts Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      All Posts ({allPosts?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {allPostsLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="border rounded-lg p-4">
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2 mb-2" />
                            <Skeleton className="h-12 w-full mb-4" />
                            <Skeleton className="h-6 w-20" />
                          </div>
                        ))}
                      </div>
                    ) : allPosts && allPosts.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                        <p className="text-gray-600">Community posts will appear here once submitted.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {allPosts?.map((post) => (
                          <div key={post.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                              {getStatusBadge(post.status || "pending")}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">{post.authorName}</span> • {post.category} • 
                              {post.createdAt && new Date(post.createdAt).toLocaleDateString()}
                            </div>
                            <p className="text-gray-700 line-clamp-2">{post.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="books" className="space-y-6">
              <BookManager />
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Content Management</h3>
                <p className="text-gray-600">Manage school information, notices, culture programs, and other website content.</p>
              </div>
              
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>School Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600">Add new schools, update information, upload media files, and manage programs.</p>
                      <div className="flex gap-2">
                        <Button className="bg-green-600 hover:bg-green-700">
                          Add New School
                        </Button>
                        <Button variant="outline">
                          Manage Existing Schools
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Culture Programs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600">Update music, fine arts, dance, drama, and poetry programs with new content.</p>
                      <div className="flex gap-2">
                        <Button variant="outline">
                          Manage Music Programs
                        </Button>
                        <Button variant="outline">
                          Manage Fine Arts
                        </Button>
                        <Button variant="outline">
                          Manage Performances
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Notices & Announcements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600">Create and manage important notices, announcements, and updates.</p>
                      <Button className="bg-red-600 hover:bg-red-700">
                        Create New Notice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                      <p className="text-gray-600">Detailed analytics will be implemented here.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Engagement Metrics</h3>
                      <p className="text-gray-600">User engagement statistics will be displayed here.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>


          </Tabs>
        </div>
      </section>
    </div>
  );
}
