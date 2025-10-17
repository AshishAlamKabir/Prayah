import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, Download, Search, Filter, Calendar, Users, DollarSign, TrendingUp, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddManualFeePaymentDialog from "./AddManualFeePaymentDialog";

export default function SchoolFeeManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<number | null>(null);

  // Get schools that user has permission to manage
  const { data: schools = [] } = useQuery({
    queryKey: ["/api/schools"],
  });

  // Filter schools based on user permissions
  const managedSchools = schools.filter((school: any) => 
    user?.role === 'admin' || 
    (user?.schoolPermissions && user.schoolPermissions.includes(school.id))
  );

  // Get fee payments for selected school
  const { data: feePayments = [], isLoading } = useQuery({
    queryKey: ["/api/fee-payments/school", selectedSchool],
    enabled: !!selectedSchool,
  });

  // Filter payments based on search and status
  const filteredPayments = feePayments.filter((payment: any) => {
    const matchesSearch = !searchTerm || 
      payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.studentRollNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.paymentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalPayments: filteredPayments.length,
    completedPayments: filteredPayments.filter((p: any) => p.paymentStatus === "completed").length,
    totalAmount: filteredPayments
      .filter((p: any) => p.paymentStatus === "completed")
      .reduce((sum: number, p: any) => sum + p.amount, 0),
    pendingPayments: filteredPayments.filter((p: any) => p.paymentStatus === "pending").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      return await apiRequest({
        url: `/api/fee-payments/${paymentId}`,
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      toast({
        title: "Success",
        description: "Fee payment deleted successfully",
      });
      setDeleteDialogOpen(false);
      setPaymentToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete fee payment",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (paymentId: number) => {
    setPaymentToDelete(paymentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (paymentToDelete) {
      deleteMutation.mutate(paymentToDelete);
    }
  };

  const downloadReceipt = (paymentId: number) => {
    // This would generate and download a PDF receipt
    window.open(`/api/fee-payments/receipt/${paymentId}`, '_blank');
  };

  if (managedSchools.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No School Access</h3>
            <p className="text-gray-500">
              You don't have permission to manage fee payments for any schools.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">School Fee Management</h2>
        <p className="text-gray-600">
          Track and manage fee payments for your schools
        </p>
      </div>

      {/* School Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select School</CardTitle>
          <CardDescription>
            Choose a school to view its fee payment data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSchool} onValueChange={setSelectedSchool}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a school to manage" />
            </SelectTrigger>
            <SelectContent>
              {managedSchools.map((school: any) => (
                <SelectItem key={school.id} value={school.id.toString()}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSchool && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedPayments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">₹{stats.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by student name or roll number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-payments"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40" data-testid="select-status-filter">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <AddManualFeePaymentDialog schoolId={parseInt(selectedSchool)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Payments</CardTitle>
              <CardDescription>
                All fee payment records for the selected school
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="mt-2 text-gray-600">Loading payments...</p>
                </div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== "all" 
                      ? "No payments match your current filters."
                      : "No fee payments have been made for this school yet."
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Details</TableHead>
                        <TableHead>Fee Month</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{payment.studentName}</p>
                              <p className="text-sm text-gray-500">
                                Roll: {payment.studentRollNo} | Class: {payment.studentClass}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{payment.feeMonth}</TableCell>
                          <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                          <TableCell>{getStatusBadge(payment.paymentStatus)}</TableCell>
                          <TableCell>
                            {payment.paidAt 
                              ? format(new Date(payment.paidAt), "MMM dd, yyyy")
                              : "-"
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {payment.paymentStatus === "completed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => downloadReceipt(payment.id)}
                                  data-testid={`button-download-receipt-${payment.id}`}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Receipt
                                </Button>
                              )}
                              {payment.paymentMethod !== "razorpay" && payment.paymentMethod !== "stripe" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteClick(payment.id)}
                                  data-testid={`button-delete-${payment.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fee payment record? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}