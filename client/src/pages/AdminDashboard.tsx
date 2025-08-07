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
  Bell
} from "lucide-react";
import SchoolAdminPanel from "@/components/admin/SchoolAdminPanel";
import CultureAdminPanel from "@/components/admin/CultureAdminPanel";
import SuperAdminPanel from "@/components/admin/SuperAdminPanel";
import BookManagement from "@/components/admin/BookManagement";
import SchoolFeeManagement from "@/components/admin/SchoolFeeManagement";
import AdminNotifications from "@/components/admin/AdminNotifications";
import FeePaymentAccessControl from "@/components/admin/FeePaymentAccessControl";
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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1">
              <TabsTrigger value="overview" className="whitespace-nowrap px-3 py-2 text-sm">Overview</TabsTrigger>
              {(dashboardUser.role === "admin" || dashboardUser.role === "school_admin") && <TabsTrigger value="schools" className="whitespace-nowrap px-3 py-2 text-sm">Schools</TabsTrigger>}
              {(dashboardUser.role === "admin" || dashboardUser.role === "culture_admin") && <TabsTrigger value="culture" className="whitespace-nowrap px-3 py-2 text-sm">Culture</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="content" className="whitespace-nowrap px-3 py-2 text-sm">Content</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="books" className="whitespace-nowrap px-3 py-2 text-sm">Books</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="analytics" className="whitespace-nowrap px-3 py-2 text-sm">Analytics</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="payments" className="whitespace-nowrap px-3 py-2 text-sm">Fee Payments</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="payment-access" className="whitespace-nowrap px-3 py-2 text-sm">Payment Access</TabsTrigger>}
              {dashboardUser.role === "admin" && <TabsTrigger value="notifications" className="whitespace-nowrap px-3 py-2 text-sm">Notifications</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <SuperAdminPanel 
              user={dashboardUser} 
              accessibleSchools={accessibleSchools}
              accessibleCultureCategories={accessibleCultureCategories}
              canManageAll={canManageAll}
            />
          </TabsContent>

          <TabsContent value="schools" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <SchoolAdminPanel 
                  user={dashboardUser}
                  accessibleSchools={accessibleSchools}
                  canManageAll={canManageAll}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="culture" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <CultureAdminPanel 
                  user={dashboardUser}
                  accessibleCultureCategories={accessibleCultureCategories}
                  canManageAll={canManageAll}
                />
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