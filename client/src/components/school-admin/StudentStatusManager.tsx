import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { TrendingUp, TrendingDown, Users, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  className: string;
  status: string;
}

interface StudentStatusManagerProps {
  schoolId: number;
  students: Student[];
}

export default function StudentStatusManager({ schoolId, students }: StudentStatusManagerProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [reason, setReason] = useState<string>("");
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

  const handleStatusUpdate = async () => {
    if (!selectedStudent || !newStatus) return;

    setIsSubmitting(true);
    try {
      await apiRequest("PUT", `/api/students/${selectedStudent}/status`, {
        body: JSON.stringify({
          newStatus,
          reason: reason || undefined,
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students"] });
      
      toast({
        title: "Success!",
        description: "Student status updated successfully",
      });

      // Reset form
      setSelectedStudent("");
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

      {/* Status Update Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Update Student Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Student</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.rollNumber} - {student.name} ({student.className})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                onClick={handleStatusUpdate}
                disabled={isSubmitting || !selectedStudent || !newStatus}
              >
                {isSubmitting ? "Updating..." : "Update Status"}
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