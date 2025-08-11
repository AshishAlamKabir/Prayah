import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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

// Import student management components
import StudentList from "@/components/school-admin/StudentList";
import AddStudentForm from "@/components/school-admin/AddStudentForm";
import ExcelUploader from "@/components/school-admin/ExcelUploader";
import FeePaymentTracker from "@/components/school-admin/FeePaymentTracker";
import StudentStatusManager from "@/components/school-admin/StudentStatusManager";
import PaymentSummary from "@/components/school-admin/PaymentSummary";
import PromotionSection from "@/components/school-admin/PromotionSection";
import DropoutSection from "@/components/school-admin/DropoutSection";

interface StudentManagementPanelProps {
  schools: any[];
}

export default function StudentManagementPanel({ schools }: StudentManagementPanelProps) {
  const [selectedSchool, setSelectedSchool] = useState<number>(
    schools.length > 0 ? schools[0].id : 1
  );
  const [activeTab, setActiveTab] = useState("overview");

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
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Student Management System</h2>
          </div>
          {schools.length > 1 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="schoolSelect">School:</Label>
              <Select
                value={selectedSchool?.toString() || ""}
                onValueChange={(value) => setSelectedSchool(parseInt(value))}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {currentSchool && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900">{currentSchool.name}</h3>
            <p className="text-blue-700 text-sm mt-1">{currentSchool.location}</p>
            <div className="flex gap-4 mt-2">
              <Badge variant="outline" className="bg-blue-100">
                {totalStudents} Students
              </Badge>
              <Badge variant="outline" className="bg-green-100">
                Academic Year: 2025-26
              </Badge>
            </div>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-1 mb-6">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-1 sm:px-2">Overview</TabsTrigger>
          <TabsTrigger value="list" className="text-xs sm:text-sm px-1 sm:px-2">Students</TabsTrigger>
          <TabsTrigger value="add" className="text-xs sm:text-sm px-1 sm:px-2">Add</TabsTrigger>
          <TabsTrigger value="upload" className="text-xs sm:text-sm px-1 sm:px-2">Upload</TabsTrigger>
          <TabsTrigger value="promotions" className="text-xs sm:text-sm px-1 sm:px-2">Promotions</TabsTrigger>
          <TabsTrigger value="dropouts" className="text-xs sm:text-sm px-1 sm:px-2">Dropouts</TabsTrigger>
          <TabsTrigger value="fees" className="text-xs sm:text-sm px-1 sm:px-2">Fees</TabsTrigger>
          <TabsTrigger value="status" className="text-xs sm:text-sm px-1 sm:px-2">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Dashboard Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-blue-600">{totalStudents}</p>
                    <p className="text-xs text-gray-500 mt-1">Across all classes and streams</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Students</p>
                    <p className="text-3xl font-bold text-green-600">{activeStudents}</p>
                    <p className="text-xs text-gray-500 mt-1">Currently enrolled</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Promoted This Year</p>
                    <p className="text-3xl font-bold text-purple-600">{promotedStudents}</p>
                    <p className="text-xs text-gray-500 mt-1">To next academic level</p>
                  </div>
                  <GraduationCap className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Classes Managed</p>
                    <p className="text-3xl font-bold text-orange-600">{Object.keys(classDistribution).length}</p>
                    <p className="text-xs text-gray-500 mt-1">From Ankur to XII</p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Class-wise Student Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(classDistribution).map(([className, count]) => (
                  <div key={className} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{count}</div>
                    <div className="text-sm text-gray-600">{className}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Fee Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentSummary schoolId={selectedSchool} summary={paymentSummary} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-6 mt-6">
          <StudentList 
            schoolId={selectedSchool} 
            students={students || []}
            isLoading={studentsLoading}
          />
        </TabsContent>

        <TabsContent value="add" className="space-y-6 mt-6">
          <AddStudentForm 
            schoolId={selectedSchool}
            classHierarchy={classHierarchy}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6 mt-6">
          <ExcelUploader 
            schoolId={selectedSchool}
            classHierarchy={classHierarchy}
          />
        </TabsContent>

        <TabsContent value="fees" className="space-y-6 mt-6">
          <FeePaymentTracker 
            schoolId={selectedSchool}
            students={students || []}
          />
        </TabsContent>

        <TabsContent value="promotions" className="space-y-6 mt-6">
          <PromotionSection 
            schoolId={selectedSchool}
          />
        </TabsContent>

        <TabsContent value="dropouts" className="space-y-6 mt-6">
          <DropoutSection 
            schoolId={selectedSchool}
          />
        </TabsContent>

        <TabsContent value="status" className="space-y-6 mt-6">
          <StudentStatusManager 
            schoolId={selectedSchool}
            students={students || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}