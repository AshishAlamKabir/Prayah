import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { School, GraduationCap, Palette, Music, Theater, BookOpen, Users, CreditCard } from "lucide-react";
import SchoolFeeManagement from "./SchoolFeeManagement";

interface RoleBasedDashboardData {
  user: {
    id: number;
    username: string;
    role: string;
    permissions: string[];
  };
  accessibleSchools: any[];
  accessibleCultureCategories: any[];
  canManageAll: boolean;
}

export default function RoleBasedAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/role-admin/dashboard"],
    retry: false,
  });

  const roleIcons = {
    admin: <Users className="h-5 w-5" />,
    school_admin: <School className="h-5 w-5" />,
    culture_admin: <Palette className="h-5 w-5" />
  };

  const roleLabels = {
    admin: "Super Administrator",
    school_admin: "School Administrator", 
    culture_admin: "Culture Administrator"
  };

  const cultureIcons = {
    music: <Music className="h-4 w-4" />,
    "fine-arts": <Palette className="h-4 w-4" />,
    dance: <Theater className="h-4 w-4" />,
    poetry: <BookOpen className="h-4 w-4" />,
    drama: <Theater className="h-4 w-4" />
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-6">
            <p className="text-center text-gray-500">No access granted. Please contact system administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, accessibleSchools, accessibleCultureCategories, canManageAll } = dashboardData as RoleBasedDashboardData;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Role-Based Admin Dashboard</h1>
          <div className="flex items-center space-x-2 mt-2">
            {roleIcons[user.role as keyof typeof roleIcons]}
            <span className="text-lg font-medium">{roleLabels[user.role as keyof typeof roleLabels]}</span>
            <Badge variant="outline">{user.username}</Badge>
          </div>
        </div>
      </div>

      {/* Access Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <School className="h-4 w-4 mr-2" />
              School Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            {canManageAll ? (
              <div className="text-2xl font-bold text-green-600">All Schools</div>
            ) : (
              <div className="text-2xl font-bold">{accessibleSchools.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {canManageAll ? "Full system access" : "Accessible schools"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              Culture Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            {canManageAll ? (
              <div className="text-2xl font-bold text-green-600">All Sections</div>
            ) : (
              <div className="text-2xl font-bold">{accessibleCultureCategories.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {canManageAll ? "Full system access" : "Accessible sections"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.permissions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active permissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4">Overview</TabsTrigger>
          {(user.role === "admin" || user.role === "school_admin") && (
            <TabsTrigger value="schools" className="text-xs sm:text-sm px-2 sm:px-4">Schools</TabsTrigger>
          )}
          {(user.role === "admin" || user.role === "culture_admin") && (
            <TabsTrigger value="culture" className="text-xs sm:text-sm px-2 sm:px-4">Culture</TabsTrigger>
          )}
          {(user.role === "admin" || user.role === "school_admin") && (
            <TabsTrigger value="fees">Fee Management</TabsTrigger>
          )}
          {user.role === "admin" && (
            <TabsTrigger value="users">User Management</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Accessible Schools */}
            {accessibleSchools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <School className="h-5 w-5 mr-2" />
                    Your Schools
                  </CardTitle>
                  <CardDescription>Schools you can manage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {accessibleSchools.map((school) => (
                    <div key={school.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{school.name}</div>
                        <div className="text-sm text-gray-500">{school.location}</div>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Accessible Culture Categories */}
            {accessibleCultureCategories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Your Culture Sections
                  </CardTitle>
                  <CardDescription>Culture sections you can manage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {accessibleCultureCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center">
                        {cultureIcons[category.name.toLowerCase() as keyof typeof cultureIcons] || <Palette className="h-4 w-4" />}
                        <div className="ml-2">
                          <div className="font-medium">{category.name}</div>
                          <div className="text-sm text-gray-500">{category.description}</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Permissions Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Your Permissions</CardTitle>
              <CardDescription>Actions you can perform in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((permission) => (
                  <Badge key={permission} variant="secondary">
                    {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools">
          <Card>
            <CardHeader>
              <CardTitle>School Management</CardTitle>
              <CardDescription>Manage your assigned schools</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                School management interface will be implemented here.
                You can manage {canManageAll ? "all schools" : `${accessibleSchools.length} schools`}.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="culture">
          <Card>
            <CardHeader>
              <CardTitle>Culture Management</CardTitle>
              <CardDescription>Manage your assigned culture sections</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                Culture management interface will be implemented here.
                You can manage {canManageAll ? "all culture sections" : `${accessibleCultureCategories.length} sections`}.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <SchoolFeeManagement />
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage role-based admin accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                User management interface will be implemented here.
                Super admins can create and manage role-based admin accounts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}