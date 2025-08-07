import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  School, 
  Users, 
  BookOpen, 
  Bell, 
  Activity,
  Calendar,
  FileText,
  Music,
  Palette,
  Theater,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SchoolAdminPanel from "@/components/admin/SchoolAdminPanel";
import CultureAdminPanel from "@/components/admin/CultureAdminPanel";
import SuperAdminPanel from "@/components/admin/SuperAdminPanel";
import BookManagement from "@/components/admin/BookManagement";
import SchoolFeeManagement from "@/components/admin/SchoolFeeManagement";
import AdminNotifications from "@/components/admin/AdminNotifications";

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
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/role-admin/dashboard"],
    retry: 1
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin dashboard.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

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
            <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">You don't have permission to access the admin dashboard.</p>
            <Button onClick={() => window.location.href = "/"}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, accessibleSchools, accessibleCultureCategories, canManageAll } = dashboardData;

  // Check if user has admin privileges (super admin, school admin, or culture admin)
  const isAdmin = user.role === "admin" || user.role === "school_admin" || user.role === "culture_admin";
  
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
                {getRoleIcon(user.role)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  <span className="text-gray-600">Welcome, {user.username}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {user.role === "admin" && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Schools</p>
                      <p className="text-2xl font-bold">{accessibleSchools.length}</p>
                    </div>
                    <School className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Culture Categories</p>
                      <p className="text-2xl font-bold">{accessibleCultureCategories.length}</p>
                    </div>
                    <Palette className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">System Status</p>
                      <p className="text-lg font-semibold text-green-600">Operational</p>
                    </div>
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          
          {user.role === "school_admin" && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assigned Schools</p>
                      <p className="text-2xl font-bold">{accessibleSchools.length}</p>
                    </div>
                    <School className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Recent Activities</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Calendar className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Notifications</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Bell className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === "culture_admin" && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Assigned Categories</p>
                      <p className="text-2xl font-bold">{accessibleCultureCategories.length}</p>
                    </div>
                    <Palette className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Programs</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Music className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Activities</p>
                      <p className="text-2xl font-bold">0</p>
                    </div>
                    <Theater className="w-8 h-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="w-full overflow-x-auto">
            <TabsList className="flex w-full min-w-fit justify-start gap-1 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="overview" className="whitespace-nowrap px-3 py-2 text-sm">Overview</TabsTrigger>
              {(user.role === "admin" || user.role === "school_admin") && <TabsTrigger value="schools" className="whitespace-nowrap px-3 py-2 text-sm">Schools</TabsTrigger>}
              {(user.role === "admin" || user.role === "culture_admin") && <TabsTrigger value="culture" className="whitespace-nowrap px-3 py-2 text-sm">Culture</TabsTrigger>}
              {user.role === "admin" && <TabsTrigger value="content" className="whitespace-nowrap px-3 py-2 text-sm">Content</TabsTrigger>}
              {user.role === "admin" && <TabsTrigger value="books" className="whitespace-nowrap px-3 py-2 text-sm">Books</TabsTrigger>}
              {user.role === "admin" && <TabsTrigger value="analytics" className="whitespace-nowrap px-3 py-2 text-sm">Analytics</TabsTrigger>}
              {user.role === "admin" && <TabsTrigger value="payments" className="whitespace-nowrap px-3 py-2 text-sm">Fee Payments</TabsTrigger>}
              {user.role === "admin" && <TabsTrigger value="notifications" className="whitespace-nowrap px-3 py-2 text-sm">Notifications</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardContent className="p-0">
                {user.role === "admin" && (
                  <SuperAdminPanel 
                    schools={accessibleSchools}
                    cultureCategories={accessibleCultureCategories}
                  />
                )}
                
                {user.role === "school_admin" && (
                  <SchoolAdminPanel 
                    schools={accessibleSchools}
                    userPermissions={user.schoolPermissions || []}
                  />
                )}
                
                {user.role === "culture_admin" && (
                  <CultureAdminPanel 
                    categories={accessibleCultureCategories}
                    userPermissions={user.culturePermissions || []}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schools" className="mt-6">
            <Card>
              <CardContent className="p-6">
                {user.role === "admin" || user.role === "school_admin" ? (
                  <SchoolAdminPanel 
                    schools={accessibleSchools}
                    userPermissions={user.schoolPermissions || []}
                  />
                ) : (
                  <div className="text-center py-8">
                    <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">You don't have permission to manage schools.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="culture" className="mt-6">
            <Card>
              <CardContent className="p-6">
                {user.role === "admin" || user.role === "culture_admin" ? (
                  <CultureAdminPanel 
                    categories={accessibleCultureCategories}
                    userPermissions={user.culturePermissions || []}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">You don't have permission to manage culture categories.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Content management features coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="books" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <BookManagement />
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