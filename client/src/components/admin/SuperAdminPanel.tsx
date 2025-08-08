import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  School, 
  Palette, 
  Settings, 
  Activity, 
  BarChart3,
  Shield,
  Database,
  GraduationCap
} from "lucide-react";
import SchoolAdminPanel from "./SchoolAdminPanel";
import CultureAdminPanel from "./CultureAdminPanel";
import StudentManagementPanel from "./StudentManagementPanel";

interface SuperAdminPanelProps {
  schools: any[];
  cultureCategories: any[];
}

export default function SuperAdminPanel({ schools, cultureCategories }: SuperAdminPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-bold">Super Admin Panel</h2>
          <Badge className="bg-red-100 text-red-800 border-red-200">Full System Access</Badge>
        </div>
        <p className="text-gray-600 mt-1">Complete system administration and management</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="schools">Schools</TabsTrigger>
          <TabsTrigger value="culture">Culture</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Schools</p>
                    <p className="text-2xl font-bold">{schools?.length || 0}</p>
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
                    <p className="text-2xl font-bold">{cultureCategories?.length || 0}</p>
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

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Admins</p>
                    <p className="text-2xl font-bold">11</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="w-5 h-5 text-blue-600" />
                  School Management Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(schools || []).map((school) => (
                    <div key={school.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{school.name}</h4>
                        <p className="text-sm text-gray-600">{school.location}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {school.studentCount || 0} Students
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {(!schools || schools.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No schools available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-green-600" />
                  Culture Categories Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(cultureCategories || []).map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                      {category.featured && (
                        <Badge className="bg-green-100 text-green-800">Featured</Badge>
                      )}
                    </div>
                  ))}
                  {(!cultureCategories || cultureCategories.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No categories available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <StudentManagementPanel schools={schools || []} />
        </TabsContent>

        <TabsContent value="schools" className="space-y-6">
          <SchoolAdminPanel 
            schools={schools || []}
            userPermissions={(schools || []).map(s => s.id)} // Super admin has access to all schools
          />
        </TabsContent>

        <TabsContent value="culture" className="space-y-6">
          <CultureAdminPanel 
            categories={cultureCategories || []}
            userPermissions={(cultureCategories || []).map(c => c.id)} // Super admin has access to all categories
          />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">User management features coming soon</p>
                <p className="text-sm text-gray-500">Manage admin roles, permissions, and user accounts</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-gray-600" />
                System Administration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">System administration features coming soon</p>
                <p className="text-sm text-gray-500">Monitor system health, manage configurations, and view analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}