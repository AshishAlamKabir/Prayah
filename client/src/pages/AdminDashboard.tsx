import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, Users, FileText, BarChart3, Settings, Upload, BookOpen, School, Palette } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { CommunityPost } from "@shared/schema";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: pendingPosts, isLoading: postsLoading } = useQuery<CommunityPost[]>({
    queryKey: ["/api/community-posts"],
    queryFn: () => fetch("/api/community-posts?status=pending").then(res => res.json()),
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

  const handleStatusUpdate = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">You need admin privileges to access this area.</p>
          <Link href="/">
            <Button>Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-red-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Control Panel</h1>
              <p className="text-xl opacity-90">Manage Prayas Platform Operations</p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="text-lg px-4 py-2 bg-yellow-500 text-black">
                Administrator
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="h-8 w-8 text-red-800 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-800 mb-2">{(stats as any)?.totalUsers || 0}</div>
                <div className="text-gray-600">Total Users</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <FileText className="h-8 w-8 text-red-800 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-800 mb-2">{(stats as any)?.totalPosts || 0}</div>
                <div className="text-gray-600">Community Posts</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <BarChart3 className="h-8 w-8 text-red-800 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-800 mb-2">{(stats as any)?.totalSchools || 0}</div>
                <div className="text-gray-600">Active Schools</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <Clock className="h-8 w-8 text-red-800 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-800 mb-2">{pendingPosts?.length || 0}</div>
                <div className="text-gray-600">Pending Reviews</div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="publications">Publications</TabsTrigger>
              <TabsTrigger value="books">Book Management</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Platform Statistics Updated</p>
                          <p className="text-sm text-gray-600">System statistics refreshed</p>
                        </div>
                      </div>
                      {pendingPosts && pendingPosts.length > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                          <Clock className="h-5 w-5 text-yellow-600" />
                          <div>
                            <p className="font-medium">{pendingPosts.length} Posts Pending Review</p>
                            <p className="text-sm text-gray-600">Community submissions awaiting approval</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        className="h-20 flex flex-col items-center justify-center bg-green-600 hover:bg-green-700"
                        onClick={() => setSelectedTab("books")}
                      >
                        <Upload className="h-6 w-6 mb-2" />
                        Upload Book
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center"
                        onClick={() => setSelectedTab("publications")}
                      >
                        <FileText className="h-6 w-6 mb-2" />
                        Review Posts
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center"
                        onClick={() => setSelectedTab("content")}
                      >
                        <School className="h-6 w-6 mb-2" />
                        Manage Schools
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center"
                        onClick={() => setSelectedTab("content")}
                      >
                        <Palette className="h-6 w-6 mb-2" />
                        Culture Programs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="publications" className="space-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Publication Management</h3>
                <p className="text-gray-600">Review and approve community submissions and published works.</p>
              </div>

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
                          <Skeleton className="h-4 w-1/2 mb-3" />
                          <Skeleton className="h-16 w-full mb-4" />
                          <Skeleton className="h-10 w-20" />
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
                            <Badge variant="secondary">Pending</Badge>
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="books" className="space-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Book & PDF Management</h3>
                <p className="text-gray-600">Upload new books, manage PDF files, and control access to digital publications.</p>
              </div>
              
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-green-600" />
                      Upload New Book
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button className="bg-green-600 hover:bg-green-700">
                        <Upload className="h-4 w-4 mr-2" />
                        Add New Book with PDF
                      </Button>
                      <p className="text-sm text-gray-600">
                        Upload new books with PDF files, set pricing, and manage subscription access.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Existing Books
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600">Manage existing book inventory, update PDFs, and modify access permissions.</p>
                      <Button variant="outline">
                        <BookOpen className="h-4 w-4 mr-2" />
                        View All Books
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Content Management</h3>
                <p className="text-gray-600">Manage school information, notices, culture programs, and other website content.</p>
              </div>
              
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <School className="h-5 w-5 text-blue-600" />
                      School Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600">Add new schools, update information, upload media files, and manage programs.</p>
                      <div className="flex gap-2">
                        <Button className="bg-green-600 hover:bg-green-700">
                          <School className="h-4 w-4 mr-2" />
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
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-600" />
                      Culture Programs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600">Update music, fine arts, dance, drama, and poetry programs with new content.</p>
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm">Manage Music</Button>
                        <Button variant="outline" size="sm">Manage Fine Arts</Button>
                        <Button variant="outline" size="sm">Manage Performances</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">System Settings</h3>
                <p className="text-gray-600">Configure platform settings and administrative options.</p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-600" />
                    Platform Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">System Configuration</h3>
                    <p className="text-gray-600">Advanced platform settings will be available here.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}