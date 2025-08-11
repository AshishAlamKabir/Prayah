import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Edit, Trash2, TrendingUp, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  className: string;
  stream?: string;
  status: string;
  parentName?: string;
  contactNumber?: string;
  admissionDate: string;
}

interface StudentListProps {
  schoolId: number;
  students: Student[];
  isLoading: boolean;
}

export default function StudentList({ schoolId, students, isLoading }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Filter students based on search and filters
  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || student.className === filterClass;
    const matchesStatus = !filterStatus || student.status === filterStatus;
    return matchesSearch && matchesClass && matchesStatus;
  }) || [];

  // Get unique classes and statuses for filters
  const uniqueClasses = [...new Set(students?.map(s => s.className) || [])];
  const uniqueStatuses = [...new Set(students?.map(s => s.status) || [])];

  const handleDeleteStudent = async (studentId: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      await apiRequest("DELETE", `/api/students/${studentId}`);
      
      // Invalidate multiple related queries to ensure cache refresh
      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students", "status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students", "dropouts"] });
      
      // Also refetch data immediately to ensure UI updates
      await queryClient.refetchQueries({ queryKey: ["/api/schools", schoolId, "students"] });
      
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  const handlePromoteStudent = async (studentId: number, studentName: string) => {
    const reason = prompt(`Enter reason for promoting ${studentName}:`);
    if (!reason) return;

    try {
      await apiRequest("PUT", `/api/students/${studentId}/status`, {
        body: JSON.stringify({
          newStatus: "promoted",
          reason,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students"] });
      toast({
        title: "Success",
        description: "Student promoted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to promote student",
        variant: "destructive",
      });
    }
  };

  const handleRefreshData = async () => {
    queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students"] });
    await queryClient.refetchQueries({ queryKey: ["/api/schools", schoolId, "students"] });
    toast({
      title: "Refreshed",
      description: "Student data has been refreshed",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "promoted": return "secondary";
      case "demoted": return "destructive";
      case "dropped_out": return "outline";
      default: return "default";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search and Filter Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Students List ({filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'})
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No students found matching your criteria
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Stream</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Parent/Guardian</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.rollNumber}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.className}</TableCell>
                      <TableCell>{student.stream || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(student.status)}>
                          {student.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.parentName || "-"}</TableCell>
                      <TableCell>{student.contactNumber || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => console.log("Edit student", student.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePromoteStudent(student.id, student.name)}>
                              <TrendingUp className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}