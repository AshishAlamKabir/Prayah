import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Users, UserCheck, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  className: string;
  status: string;
  stream?: string;
}

interface StudentStatusManagerProps {
  schoolId: number;
  students: Student[];
}

export default function StudentStatusManager({ schoolId, students }: StudentStatusManagerProps) {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [newStatus, setNewStatus] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const statusOptions = [
    { value: "active", label: "Active", color: "default" },
    { value: "promoted", label: "Promoted", color: "secondary" },
    { value: "demoted", label: "Demoted", color: "destructive" },
    { value: "dropped_out", label: "Dropped Out", color: "outline" },
    { value: "transferred", label: "Transferred", color: "outline" },
  ];

  const getStatusBadgeVariant = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color as any || "default";
  };

  // Filter and search students
  const filteredStudents = useMemo(() => {
    return students?.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = classFilter === "all" || student.className === classFilter;
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      
      return matchesSearch && matchesClass && matchesStatus;
    }) || [];
  }, [students, searchTerm, classFilter, statusFilter]);

  // Get unique classes for filter
  const uniqueClasses = useMemo(() => {
    const classes = students?.map(s => s.className) || [];
    return Array.from(new Set(classes)).sort();
  }, [students]);

  const handleStudentSelection = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedStudents.length === 0 || !newStatus) return;

    setIsSubmitting(true);
    try {
      // Update status for all selected students
      await Promise.all(
        selectedStudents.map(studentId =>
          apiRequest("PUT", `/api/students/${studentId}/status`, {
            newStatus,
            reason: reason || undefined,
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students"] });
      
      toast({
        title: "Success!",
        description: `Updated status for ${selectedStudents.length} student(s)`,
      });

      // Reset form
      setSelectedStudents([]);
      setNewStatus("");
      setReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student status",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status distribution for overview
  const statusDistribution = students?.reduce((acc, student) => {
    acc[student.status] = (acc[student.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statusOptions.map((status) => (
          <Card key={status.value}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {statusDistribution[status.value] || 0}
              </div>
              <Badge variant={getStatusBadgeVariant(status.value)} className="mt-2">
                {status.label}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Search & Filter Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search by name or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map((className) => (
                  <SelectItem key={className} value={className}>
                    Class {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student Selection Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Select Students ({filteredStudents.length} found)
            </span>
            {selectedStudents.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedStudents.length} selected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Current Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => handleStudentSelection(student.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.rollNumber}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      {student.className}
                      {student.stream && ` (${student.stream})`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(student.status)}>
                        {statusOptions.find(s => s.value === student.status)?.label || student.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No students found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Status Update Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Update Status for Selected Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="text-sm text-muted-foreground">
                  {selectedStudents.length === 0 ? (
                    "No students selected"
                  ) : (
                    `Ready to update ${selectedStudents.length} student(s)`
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reason (Optional)</label>
              <Textarea
                placeholder="Enter reason for status change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleBulkStatusUpdate}
                disabled={isSubmitting || selectedStudents.length === 0 || !newStatus}
              >
                {isSubmitting ? "Updating..." : `Update Status (${selectedStudents.length})`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Status Changes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Status Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Status change history will be implemented with audit trail
          </div>
        </CardContent>
      </Card>
    </div>
  );
}