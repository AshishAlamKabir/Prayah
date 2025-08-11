import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  UserX, 
  Search, 
  RefreshCw, 
  TrendingUp,
  AlertTriangle,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  className: string;
  status: string;
  stream?: string;
  admissionDate: string;
  parentName?: string;
  contactNumber?: string;
}

interface DropoutSectionProps {
  schoolId: number;
}

export default function DropoutSection({ schoolId }: DropoutSectionProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDropouts, setSelectedDropouts] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch dropout students
  const { data: dropoutStudents = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/schools", schoolId, "students", "dropouts"],
    queryFn: () => apiRequest("GET", `/api/schools/${schoolId}/students/dropouts`).then(res => res.json()),
  });

  // Filter dropouts by search term
  const filteredDropouts = dropoutStudents.filter((student: Student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.className.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReactivateStudent = async (studentId: number) => {
    try {
      await apiRequest("PUT", `/api/students/${studentId}/status`, {
        newStatus: "active",
        reason: "Reactivated from dropout status",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students", "dropouts"] });
      
      toast({
        title: "Success!",
        description: "Student has been reactivated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate student",
        variant: "destructive",
      });
    }
  };

  const handleBulkReactivate = async () => {
    if (selectedDropouts.length === 0) return;

    try {
      await Promise.all(
        selectedDropouts.map(studentId =>
          apiRequest("PUT", `/api/students/${studentId}/status`, {
            newStatus: "active",
            reason: "Bulk reactivated from dropout status",
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students", "dropouts"] });
      
      toast({
        title: "Success!",
        description: `Reactivated ${selectedDropouts.length} student(s)`,
      });
      
      setSelectedDropouts([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reactivate students",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin" />
          <p className="mt-2 text-sm text-muted-foreground">Loading dropout students...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-6 h-6 mx-auto text-destructive" />
          <p className="mt-2 text-sm text-destructive">Failed to load dropout students</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <UserX className="w-8 h-8 mx-auto text-orange-500" />
            <div className="text-2xl font-bold mt-2">{dropoutStudents.length}</div>
            <p className="text-sm text-muted-foreground">Total Dropouts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-green-500" />
            <div className="text-2xl font-bold mt-2">{selectedDropouts.length}</div>
            <p className="text-sm text-muted-foreground">Selected for Reactivation</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto text-blue-500" />
            <div className="text-2xl font-bold mt-2">{filteredDropouts.length}</div>
            <p className="text-sm text-muted-foreground">Filtered Results</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <UserX className="w-5 h-5 mr-2 text-orange-500" />
              Dropout Students Management
            </span>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search dropout students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {selectedDropouts.length > 0 && (
              <Button onClick={handleBulkReactivate} className="shrink-0">
                <TrendingUp className="w-4 h-4 mr-2" />
                Reactivate Selected ({selectedDropouts.length})
              </Button>
            )}
          </div>

          {filteredDropouts.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                {dropoutStudents.length === 0 
                  ? "No dropout students found" 
                  : "No students match your search criteria"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedDropouts.length === filteredDropouts.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDropouts(filteredDropouts.map(s => s.id));
                          } else {
                            setSelectedDropouts([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDropouts.map((student: Student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedDropouts.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDropouts([...selectedDropouts, student.id]);
                            } else {
                              setSelectedDropouts(selectedDropouts.filter(id => id !== student.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {student.className}
                          {student.stream && ` (${student.stream})`}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.parentName || "N/A"}</TableCell>
                      <TableCell>{student.contactNumber || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          Dropped Out
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleReactivateStudent(student.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Reactivate
                        </Button>
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