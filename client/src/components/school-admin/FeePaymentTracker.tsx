import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Receipt, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const feePaymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  paymentAmount: z.string().min(1, "Amount is required"),
  paymentMode: z.enum(["cash", "website", "upi"], {
    required_error: "Payment mode is required",
  }),
  feeType: z.string().min(1, "Fee type is required"),
  month: z.string().optional(),
  receiptNumber: z.string().optional(),
  remarks: z.string().optional(),
  paymentReference: z.string().optional(),
});

type FeePaymentData = z.infer<typeof feePaymentSchema>;

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  className: string;
}

interface FeePaymentTrackerProps {
  schoolId: number;
  students: Student[];
}

export default function FeePaymentTracker({ schoolId, students }: FeePaymentTrackerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudentPayments, setSelectedStudentPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FeePaymentData>({
    resolver: zodResolver(feePaymentSchema),
    defaultValues: {
      studentId: "",
      paymentAmount: "",
      paymentMode: "cash",
      feeType: "monthly",
      month: "",
      receiptNumber: "",
      remarks: "",
      paymentReference: "",
    },
  });

  const watchedStudentId = form.watch("studentId");
  const watchedPaymentMode = form.watch("paymentMode");

  // Filter students based on search and class
  const filteredStudents = useMemo(() => {
    return students?.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = classFilter === "all" || student.className === classFilter;
      
      return matchesSearch && matchesClass;
    }) || [];
  }, [students, searchTerm, classFilter]);

  // Get unique classes for filter
  const uniqueClasses = useMemo(() => {
    const classes = students?.map(s => s.className) || [];
    return Array.from(new Set(classes)).sort();
  }, [students]);

  const clearSearch = () => {
    setSearchTerm("");
    setClassFilter("all");
  };

  // Load student payments when student is selected
  const loadStudentPayments = async (studentId: string) => {
    if (!studentId) {
      setSelectedStudentPayments([]);
      return;
    }

    try {
      const response = await apiRequest("GET", `/api/students/${studentId}/payments`);
      const payments = await response.json();
      setSelectedStudentPayments(payments);
    } catch (error) {
      console.error("Failed to load student payments:", error);
      setSelectedStudentPayments([]);
    }
  };

  // Handle student selection
  const handleStudentChange = (studentId: string) => {
    form.setValue("studentId", studentId);
    loadStudentPayments(studentId);
  };

  const onSubmit = async (data: FeePaymentData) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", `/api/students/${data.studentId}/payments`, {
        body: JSON.stringify({
          ...data,
          studentId: parseInt(data.studentId),
          schoolId,
          paymentAmount: parseFloat(data.paymentAmount),
          paymentDate: new Date().toISOString(),
          academicYear: "2025-26",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "payments", "summary"] });
      
      toast({
        title: "Success!",
        description: "Fee payment recorded successfully",
      });

      // Reload student payments
      loadStudentPayments(data.studentId);
      
      // Reset form but keep student selected
      const currentStudentId = data.studentId;
      form.reset();
      form.setValue("studentId", currentStudentId);
      form.setValue("paymentMode", "cash");
      form.setValue("feeType", "monthly");

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentModeBadge = (mode: string) => {
    const variants = {
      cash: "default",
      website: "secondary", 
      upi: "outline"
    } as const;
    return variants[mode as keyof typeof variants] || "default";
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return now.toISOString().slice(0, 7); // YYYY-MM format
  };

  const selectedStudent = students?.find(s => s.id === parseInt(watchedStudentId));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Fee Payment Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Search and Filter Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Find Student</h4>
                  {(searchTerm || classFilter !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSearch}
                      type="button"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>

                {filteredStudents.length !== students?.length && (
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredStudents.length} of {students?.length || 0} students
                  </div>
                )}
              </div>

              {/* Student Selection */}
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Student *</FormLabel>
                    <Select onValueChange={handleStudentChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a student..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {filteredStudents.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            No students found matching your criteria
                          </div>
                        ) : (
                          filteredStudents.map((student) => (
                            <SelectItem key={student.id} value={student.id.toString()}>
                              {student.rollNumber} - {student.name} ({student.className})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedStudent && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium">Selected Student:</h4>
                  <p className="text-sm text-gray-600">
                    {selectedStudent.name} | Roll: {selectedStudent.rollNumber} | Class: {selectedStudent.className}
                  </p>
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="paymentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Amount (₹) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="website">Website/Online</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="feeType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly Fee</SelectItem>
                          <SelectItem value="annual">Annual Fee</SelectItem>
                          <SelectItem value="admission">Admission Fee</SelectItem>
                          <SelectItem value="examination">Examination Fee</SelectItem>
                          <SelectItem value="activity">Activity Fee</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month (for monthly fees)</FormLabel>
                      <FormControl>
                        <Input 
                          type="month" 
                          {...field} 
                          defaultValue={getCurrentMonth()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="receiptNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter receipt number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(watchedPaymentMode === "website" || watchedPaymentMode === "upi") && (
                  <FormField
                    control={form.control}
                    name="paymentReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Reference/Transaction ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter transaction ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || !watchedStudentId}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Recording Payment...
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4 mr-2" />
                      Record Payment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Student Payment History */}
      {selectedStudent && selectedStudentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History - {selectedStudent.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedStudentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>₹{payment.paymentAmount}</TableCell>
                    <TableCell className="capitalize">{payment.feeType}</TableCell>
                    <TableCell>
                      <Badge variant={getPaymentModeBadge(payment.paymentMode)}>
                        {payment.paymentMode.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.month || "-"}</TableCell>
                    <TableCell>{payment.receiptNumber || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}