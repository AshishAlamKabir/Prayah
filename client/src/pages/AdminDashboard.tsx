import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, BarChart3, BookOpen, School, Palette, ShoppingBag } from "lucide-react";
import BookManagement from "@/components/admin/BookManagement";
import OrderManagement from "@/components/admin/OrderManagement";
import CommunityManagement from "@/components/admin/CommunityManagement";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Stats } from "@shared/schema";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">You need admin privileges to access this area.</p>
          <Link href="/">
            <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Go to Home</button>
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
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-xl text-red-100">Welcome back, {user.firstName || user.username}!</p>
            </div>
            <div className="text-right">
              <p className="text-red-100">Role: Administrator</p>
              <p className="text-red-100">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalSchools ?? 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Community Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalPosts ?? 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Books Available</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalBooks ?? 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalMembers ?? 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="publications">Community</TabsTrigger>
              <TabsTrigger value="books">Books</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
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
                      <button 
                        className="h-20 flex flex-col items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded"
                        onClick={() => setSelectedTab("books")}
                      >
                        <BookOpen className="h-6 w-6 mb-2" />
                        Manage Books
                      </button>
                      
                      <button 
                        className="h-20 flex flex-col items-center justify-center border border-gray-300 hover:bg-gray-50 rounded"
                        onClick={() => setSelectedTab("publications")}
                      >
                        <FileText className="h-6 w-6 mb-2" />
                        Review Posts
                      </button>
                      
                      <button 
                        className="h-20 flex flex-col items-center justify-center border border-gray-300 hover:bg-gray-50 rounded"
                        onClick={() => setSelectedTab("content")}
                      >
                        <School className="h-6 w-6 mb-2" />
                        Manage Schools
                      </button>
                      
                      <button 
                        className="h-20 flex flex-col items-center justify-center border border-gray-300 hover:bg-gray-50 rounded"
                        onClick={() => setSelectedTab("content")}
                      >
                        <Palette className="h-6 w-6 mb-2" />
                        Culture Programs
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="publications" className="space-y-6">
              <CommunityManagement />
            </TabsContent>

            <TabsContent value="books" className="space-y-6">
              <BookManagement />
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <OrderManagement />
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
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                          <School className="h-4 w-4 mr-2 inline" />
                          Add New School
                        </button>
                        <button className="border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded">
                          Manage Existing Schools
                        </button>
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
                        <button className="border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded text-sm">Manage Music</button>
                        <button className="border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded text-sm">Manage Fine Arts</button>
                        <button className="border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded text-sm">Manage Performances</button>
                      </div>
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