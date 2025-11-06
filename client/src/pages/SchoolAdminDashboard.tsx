import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Upload,
  DollarSign,
  TrendingUp,
  GraduationCap,
  FileText,
  BarChart3,
} from "lucide-react";
// Import available components
import StudentList from "@/components/school-admin/StudentList";
import AddStudentForm from "@/components/school-admin/AddStudentForm";
import ExcelUploader from "@/components/school-admin/ExcelUploader";
import FeePaymentTracker from "@/components/school-admin/FeePaymentTracker";
import StudentStatusManager from "@/components/school-admin/StudentStatusManager";
import PaymentSummary from "@/components/school-admin/PaymentSummary";

export default function SchoolAdminDashboard() {
  const [selectedSchool, setSelectedSchool] = useState<number>(2); // Default to first available school
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch schools for admin
  const { data: schools } = useQuery({
    queryKey: ["/api/schools"],
    queryFn: () => apiRequest("GET", "/api/schools").then(res => res.json()),
  });

  // Fetch students for selected school
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/schools", selectedSchool, "students"],
    queryFn: () => apiRequest("GET", `/api/schools/${selectedSchool}/students`).then(res => res.json()),
    enabled: !!selectedSchool,
  });

  // Fetch payment summary
  const { data: paymentSummary } = useQuery({
    queryKey: ["/api/schools", selectedSchool, "payments", "summary"],
    queryFn: () => apiRequest("GET", `/api/schools/${selectedSchool}/payments/summary`).then(res => res.json()),
    enabled: !!selectedSchool,
  });

  // Get class hierarchy
  const { data: classHierarchy } = useQuery({
    queryKey: ["/api/class-hierarchy"],
    queryFn: () => apiRequest("GET", "/api/class-hierarchy").then(res => res.json()),
  });

  const currentSchool = schools?.find((s: any) => s.id === selectedSchool);
  
  // Calculate dashboard statistics
  const totalStudents = students?.length || 0;
  const activeStudents = students?.filter((s: any) => s.status === 'active')?.length || 0;
  const promotedStudents = students?.filter((s: any) => s.status === 'promoted')?.length || 0;
  const classDistribution = students?.reduce((acc: any, student: any) => {
    acc[student.className] = (acc[student.className] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                School Administration Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                {currentSchool?.name || "School"} - Complete Student Management System
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {schools?.map((school: any) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Academic Year: 2025-26
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Across all classes and streams
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeStudents}</div>
              <p className="text-xs text-muted-foreground">
                Currently enrolled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promoted This Year</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promotedStudents}</div>
              <p className="text-xs text-muted-foreground">
                To next academic level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes Managed</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(classDistribution).length}</div>
              <p className="text-xs text-muted-foreground">
                From Ankur to XII
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="add-student">Add Student</TabsTrigger>
              <TabsTrigger value="upload">Excel Upload</TabsTrigger>
              <TabsTrigger value="fees">Fee Payments</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Class Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Class-wise Distribution</CardTitle>
                    <CardDescription>
                      Student enrollment across different classes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(classDistribution)
                        .sort(([a], [b]) => {
                          const orderA = classHierarchy?.classOrder?.[a] || 999;
                          const orderB = classHierarchy?.classOrder?.[b] || 999;
                          return orderA - orderB;
                        })
                        .map(([className, count]) => (
                          <div key={className} className="flex items-center justify-between">
                            <span className="font-medium">{className}</span>
                            <Badge variant="outline">{count as number} students</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Fee Collection Summary</CardTitle>
                    <CardDescription>
                      Payment tracking by mode for current academic year
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PaymentSummary schoolId={selectedSchool} summary={paymentSummary} />
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest student management activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Activity tracking will be implemented with status change history
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students" className="p-6">
              <StudentList 
                schoolId={selectedSchool} 
                students={students} 
                isLoading={studentsLoading}
              />
            </TabsContent>

            <TabsContent value="add-student" className="p-6">
              <AddStudentForm 
                schoolId={selectedSchool} 
                classHierarchy={classHierarchy}
              />
            </TabsContent>

            <TabsContent value="upload" className="p-6">
              <ExcelUploader 
                schoolId={selectedSchool}
                classHierarchy={classHierarchy}
              />
            </TabsContent>

            <TabsContent value="fees" className="p-6">
              <FeePaymentTracker 
                schoolId={selectedSchool}
                students={students}
              />
            </TabsContent>

            <TabsContent value="reports" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Student Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate comprehensive student lists and academic reports
                    </p>
                    <Button variant="outline" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Fee Collection Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Detailed fee payment tracking and collection summaries
                    </p>
                    <Button variant="outline" className="w-full">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Analytics Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Student performance and attendance analytics
                    </p>
                    <Button variant="outline" className="w-full">
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}