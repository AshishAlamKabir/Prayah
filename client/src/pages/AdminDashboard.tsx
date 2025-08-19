import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  School, 
  Palette, 
  Activity, 
  LogIn,
  FileText,
  BarChart3,
  BookOpen,
  DollarSign,
  Bell,
  ShoppingCart,
  GraduationCap,
  Settings
} from "lucide-react";
import SchoolAdminPanel from "@/components/admin/SchoolAdminPanel";
import CultureAdminPanel from "@/components/admin/CultureAdminPanel";
import SuperAdminPanel from "@/components/admin/SuperAdminPanel";
import BookManagement from "@/components/admin/BookManagement";
import SchoolFeeManagement from "@/components/admin/SchoolFeeManagement";
import AdminNotifications from "@/components/admin/AdminNotifications";
import FeePaymentAccessControl from "@/components/admin/FeePaymentAccessControl";
import BookRallyAudit from "@/components/admin/BookRallyAudit";
import PublicationsAudit from "@/components/admin/PublicationsAudit";
import { OrderManagement } from "@/components/admin/OrderManagement";
import { Link } from "wouter";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  schoolPermissions?: number[];
  culturePermissions?: number[];
  permissions?: string[];
}

interface DashboardData {
  user: User;
  accessibleSchools: any[];
  accessibleCultureCategories: any[];
  canManageAll: boolean;
}

export default function AdminDashboard() {
  // All hooks must be called at the top - no conditional hook calls allowed
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Calculate derived values but don't use them in conditional returns yet
  const hasAdminAccess = user?.role === 'admin' || user?.role === 'school_admin' || user?.role === 'culture_admin';
  
  // Always call useQuery - use enabled to control when it runs
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/role-admin/dashboard"],
    retry: 1,
    enabled: !!user && hasAdminAccess && isAuthenticated && !authLoading
  });

  // Always call useEffect
  useEffect(() => {
    if (error) {
      toast({
        title: "Error Loading Dashboard",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  // Now we can do conditional rendering after all hooks are called
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LogIn className="h-6 w-6" />
              <span>Authentication Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">Please log in to access the admin dashboard.</p>
            <Link href="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">You don't have permission to access the admin dashboard.</p>
            <Link href="/">
              <Button variant="outline" className="mt-4">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Unable to load dashboard data. Please try again.</p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user: dashboardUser, accessibleSchools, accessibleCultureCategories, canManageAll } = dashboardData;

  // Check if user has admin privileges (super admin, school admin, or culture admin)
  const isAdmin = dashboardUser.role === "admin" || dashboardUser.role === "school_admin" || dashboardUser.role === "culture_admin";
  
  // If not an admin, redirect to main site
  if (!isAdmin) {
    window.location.href = "/";
    return null;
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin": return <Users className="w-6 h-6" />;
      case "school_admin": return <School className="w-6 h-6" />;
      case "culture_admin": return <Palette className="w-6 h-6" />;
      default: return <Activity className="w-6 h-6" />;
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin": return "Super Administrator";
      case "school_admin": return "School Administrator";
      case "culture_admin": return "Culture Administrator";
      default: return "Administrator";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 border-red-200";
      case "school_admin": return "bg-blue-100 text-blue-800 border-blue-200";
      case "culture_admin": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                {getRoleIcon(dashboardUser.role)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back, {dashboardUser.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={`px-3 py-1 text-sm font-medium border ${getRoleBadgeColor(dashboardUser.role)}`}>
                {getRoleDisplayName(dashboardUser.role)}
              </Badge>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-1 h-auto p-1">
              <TabsTrigger value="overview" className="whitespace-nowrap px-3 py-2 text-sm">Overview</TabsTrigger>
              {(dashboardUser.role === "admin" || dashboardUser.role === "school_admin") && <TabsTrigger value="schools" className="whitespace-nowrap px-3 py-2 text-sm">Schools</TabsTrigger>}
              {(dashboardUser.role === "admin" || dashboardUser.role === "culture_admin") && <TabsTrigger value="culture" className="whitespace-nowrap px-3 py-2 text-sm">Culture</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="content" className="whitespace-nowrap px-3 py-2 text-sm">Content</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="books" className="whitespace-nowrap px-3 py-2 text-sm">Books</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="orders" className="whitespace-nowrap px-3 py-2 text-sm">Orders</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="analytics" className="whitespace-nowrap px-3 py-2 text-sm">Analytics</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="payments" className="whitespace-nowrap px-3 py-2 text-sm">Fee Payments</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="book-rally-audit" className="whitespace-nowrap px-3 py-2 text-sm">Book Rally Audit</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="publications-audit" className="whitespace-nowrap px-3 py-2 text-sm">Publications Audit</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="payment-access" className="whitespace-nowrap px-3 py-2 text-sm">Payment Access</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="notifications" className="whitespace-nowrap px-3 py-2 text-sm">Notifications</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            {dashboardUser.role === "admin" ? (
              <SuperAdminPanel 
                schools={accessibleSchools}
                cultureCategories={accessibleCultureCategories}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      {getRoleIcon(dashboardUser.role)}
                      <div>
                        <h2 className="text-2xl font-bold">{getRoleDisplayName(dashboardUser.role)}</h2>
                        <p className="text-gray-600">Manage your assigned resources</p>
                      </div>
                    </div>
                    
                    {dashboardUser.role === "school_admin" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Assigned Schools</p>
                                <p className="text-2xl font-bold">{accessibleSchools?.length || 0}</p>
                              </div>
                              <School className="w-8 h-8 text-blue-600" />
                            </div>
                          </CardContent>
                        </Card>
                        
                        {accessibleSchools?.map(school => (
                          <Card key={school.id}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-600">{school.name}</p>
                                  <p className="text-lg font-semibold">{school.studentCount || 0} Students</p>
                                </div>
                                <GraduationCap className="w-8 h-8 text-green-600" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                    
                    {dashboardUser.role === "culture_admin" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600">Assigned Categories</p>
                                <p className="text-2xl font-bold">{accessibleCultureCategories?.length || 0}</p>
                              </div>
                              <Palette className="w-8 h-8 text-green-600" />
                            </div>
                          </CardContent>
                        </Card>
                        
                        {accessibleCultureCategories?.map(category => (
                          <Card key={category.id}>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-gray-600">{category.name}</p>
                                  <p className="text-sm text-gray-500">{category.description}</p>
                                </div>
                                <Palette className="w-8 h-8 text-purple-600" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="schools" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <SchoolAdminPanel 
                  schools={accessibleSchools || []}
                  userPermissions={(accessibleSchools || []).map(s => s.id)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="culture" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <CultureAdminPanel 
                  categories={accessibleCultureCategories || []}
                  userPermissions={(accessibleCultureCategories || []).map(c => c.id)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Management</h2>
                <p className="text-gray-600">Edit and manage content across the platform</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* School Content Management */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <School className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">School Content</h3>
                          <p className="text-sm text-gray-600">{accessibleSchools?.length || 0} schools</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">Manage school descriptions, missions, visions, history, and media content.</p>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Editable sections:</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">About Us</Badge>
                        <Badge variant="outline">Mission</Badge>
                        <Badge variant="outline">Vision</Badge>
                        <Badge variant="outline">History</Badge>
                        <Badge variant="outline">Infrastructure</Badge>
                        <Badge variant="outline">Media Gallery</Badge>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => setActiveTab("schools")}
                    >
                      Manage School Content
                    </Button>
                  </CardContent>
                </Card>

                {/* Cultural Programs Content Management */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Palette className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Cultural Programs</h3>
                          <p className="text-sm text-gray-600">{accessibleCultureCategories?.length || 0} programs</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">Edit cultural program information, objectives, activities, and instructor details.</p>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Editable sections:</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">About Section</Badge>
                        <Badge variant="outline">Objectives</Badge>
                        <Badge variant="outline">Activities</Badge>
                        <Badge variant="outline">Instructor Info</Badge>
                        <Badge variant="outline">Schedule</Badge>
                        <Badge variant="outline">Media Files</Badge>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => setActiveTab("culture")}
                    >
                      Manage Cultural Content
                    </Button>
                  </CardContent>
                </Card>

                {/* About Page Content Management */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">About Page</h3>
                          <p className="text-sm text-gray-600">Platform information</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">Manage Prayas Study Circle information, mission, and organizational content.</p>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Editable sections:</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Mission</Badge>
                        <Badge variant="outline">Vision</Badge>
                        <Badge variant="outline">History</Badge>
                        <Badge variant="outline">Team Info</Badge>
                        <Badge variant="outline">Achievements</Badge>
                      </div>
                    </div>
                    <Link href="/about">
                      <Button className="w-full mt-4" variant="outline">
                        View About Page
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Books and Publications */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <BookOpen className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Books & Publications</h3>
                          <p className="text-sm text-gray-600">Book store content</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">Manage book descriptions, categories, featured content, and publication details.</p>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Editable sections:</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Book Info</Badge>
                        <Badge variant="outline">Categories</Badge>
                        <Badge variant="outline">Descriptions</Badge>
                        <Badge variant="outline">Featured Books</Badge>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => setActiveTab("books")}
                    >
                      Manage Book Content
                    </Button>
                  </CardContent>
                </Card>

                {/* Community Content */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <Users className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Community Posts</h3>
                          <p className="text-sm text-gray-600">User submissions</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">Review and manage community posts, announcements, and user-generated content.</p>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Management features:</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Post Approval</Badge>
                        <Badge variant="outline">Content Review</Badge>
                        <Badge variant="outline">Categories</Badge>
                        <Badge variant="outline">Announcements</Badge>
                      </div>
                    </div>
                    <Link href="/community">
                      <Button className="w-full mt-4" variant="outline">
                        View Community
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* General Platform Settings */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Settings className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Platform Settings</h3>
                          <p className="text-sm text-gray-600">Global configuration</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">Configure platform-wide settings, navigation, and general content.</p>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-500">Configuration options:</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Navigation</Badge>
                        <Badge variant="outline">Footer Content</Badge>
                        <Badge variant="outline">Contact Info</Badge>
                        <Badge variant="outline">Social Links</Badge>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline" disabled>
                      Platform Settings
                      <span className="text-xs ml-2">(Coming Soon)</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Content Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Content Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{accessibleSchools?.length || 0}</div>
                      <div className="text-sm text-gray-600">Schools</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{accessibleCultureCategories?.length || 0}</div>
                      <div className="text-sm text-gray-600">Cultural Programs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">1</div>
                      <div className="text-sm text-gray-600">About Page</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">All</div>
                      <div className="text-sm text-gray-600">Sections Active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="books" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <BookManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <OrderManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Analytics dashboard coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <SchoolFeeManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="book-rally-audit" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <BookRallyAudit />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="publications-audit" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <PublicationsAudit />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment-access" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <FeePaymentAccessControl />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <AdminNotifications adminUserId={user.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}