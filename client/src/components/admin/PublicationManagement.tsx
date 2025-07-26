import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, FileText, Clock, CheckCircle, XCircle, Eye, 
  Download, DollarSign, Send, User, Calendar, Filter
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PublicationSubmission {
  id: number;
  title: string;
  author: string;
  email: string;
  category: string;
  description: string;
  pdfUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'payment_pending' | 'published';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  publicationFee?: number;
}

export default function PublicationManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch publication submissions
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["/api/admin/publication-submissions"],
  });

  // Approve submission mutation
  const approveSubmissionMutation = useMutation({
    mutationFn: async ({ id, notes, fee }: { id: number; notes?: string; fee: number }) => {
      return await apiRequest("PATCH", `/api/admin/publication-submissions/${id}/approve`, {
        adminNotes: notes,
        publicationFee: fee
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/publication-submissions"] });
      toast({
        title: "Success",
        description: "Submission approved and payment link sent to author!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve submission. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject submission mutation
  const rejectSubmissionMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return await apiRequest("PATCH", `/api/admin/publication-submissions/${id}/reject`, {
        adminNotes: notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/publication-submissions"] });
      toast({
        title: "Success",
        description: "Submission rejected and author notified.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject submission. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pending Review" },
      approved: { variant: "default", icon: CheckCircle, label: "Approved" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
      payment_pending: { variant: "outline", icon: DollarSign, label: "Payment Pending" },
      published: { variant: "default", icon: BookOpen, label: "Published" }
    };

    const config = variants[status] || variants.pending;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleApprove = async (submission: PublicationSubmission) => {
    const notes = prompt("Add review notes (optional):");
    const feeInput = prompt("Enter publication fee (₹):", "2500");
    const fee = parseFloat(feeInput || "2500");

    if (isNaN(fee) || fee < 0) {
      toast({
        title: "Invalid Fee",
        description: "Please enter a valid publication fee amount.",
        variant: "destructive",
      });
      return;
    }

    approveSubmissionMutation.mutate({ id: submission.id, notes: notes || undefined, fee });
  };

  const handleReject = async (submission: PublicationSubmission) => {
    const notes = prompt("Enter rejection reason:");
    if (!notes) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    rejectSubmissionMutation.mutate({ id: submission.id, notes });
  };

  const filteredSubmissions = Array.isArray(submissions) ? submissions.filter((submission: PublicationSubmission) => {
    if (statusFilter === "all") return true;
    return submission.status === statusFilter;
  }) : [];

  const getSubmissionsByStatus = (status: string) => {
    return filteredSubmissions.filter((s: PublicationSubmission) => s.status === status);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Publication Management</h2>
          <p className="text-gray-600">Review and manage book publication submissions</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Submissions</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="payment_pending">Payment Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({getSubmissionsByStatus("pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Approved ({getSubmissionsByStatus("approved").length})
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Payment ({getSubmissionsByStatus("payment_pending").length})
          </TabsTrigger>
          <TabsTrigger value="published" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Published ({getSubmissionsByStatus("published").length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Rejected ({getSubmissionsByStatus("rejected").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Pending Review ({getSubmissionsByStatus("pending").length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading submissions...</div>
              ) : getSubmissionsByStatus("pending").length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Pending Submissions</h3>
                  <p className="text-gray-500">All submissions have been reviewed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getSubmissionsByStatus("pending").map((submission: PublicationSubmission) => (
                    <div key={submission.id} className="border rounded-lg p-6 bg-white">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{submission.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {submission.author}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(submission.submittedAt).toLocaleDateString()}
                            </div>
                            <Badge variant="outline">{submission.category}</Badge>
                          </div>
                          <p className="text-gray-700 mb-4">{submission.description}</p>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(submission.pdfUrl, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(submission.pdfUrl, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(submission)}
                            disabled={rejectSubmissionMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(submission)}
                            disabled={approveSubmissionMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve & Send Payment Link
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Approved Submissions ({getSubmissionsByStatus("approved").length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getSubmissionsByStatus("approved").length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Approved Submissions</h3>
                  <p className="text-gray-500">Approved submissions will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getSubmissionsByStatus("approved").map((submission: PublicationSubmission) => (
                    <div key={submission.id} className="border rounded-lg p-6 bg-green-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{submission.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {submission.author}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ₹{submission.publicationFee}
                            </div>
                          </div>
                          {submission.adminNotes && (
                            <p className="text-sm text-gray-600 bg-white p-2 rounded border-l-4 border-green-500">
                              <strong>Admin Notes:</strong> {submission.adminNotes}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Payment Pending ({getSubmissionsByStatus("payment_pending").length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getSubmissionsByStatus("payment_pending").length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payment Pending</h3>
                  <p className="text-gray-500">Authors awaiting payment will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getSubmissionsByStatus("payment_pending").map((submission: PublicationSubmission) => (
                    <div key={submission.id} className="border rounded-lg p-6 bg-blue-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{submission.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {submission.author} ({submission.email})
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ₹{submission.publicationFee}
                            </div>
                          </div>
                          <p className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                            Payment link sent to author. Awaiting payment confirmation.
                          </p>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="published" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Published Books ({getSubmissionsByStatus("published").length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getSubmissionsByStatus("published").length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Published Books</h3>
                  <p className="text-gray-500">Successfully published books will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getSubmissionsByStatus("published").map((submission: PublicationSubmission) => (
                    <div key={submission.id} className="border rounded-lg p-6 bg-purple-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{submission.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {submission.author}
                            </div>
                            <Badge variant="outline">{submission.category}</Badge>
                          </div>
                          <p className="text-sm text-purple-700 bg-purple-100 p-2 rounded">
                            ✓ Successfully published by Prayas Publications
                          </p>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Rejected Submissions ({getSubmissionsByStatus("rejected").length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getSubmissionsByStatus("rejected").length === 0 ? (
                <div className="text-center py-8">
                  <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Rejected Submissions</h3>
                  <p className="text-gray-500">Rejected submissions will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getSubmissionsByStatus("rejected").map((submission: PublicationSubmission) => (
                    <div key={submission.id} className="border rounded-lg p-6 bg-red-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{submission.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {submission.author}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Rejected: {submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          {submission.adminNotes && (
                            <p className="text-sm text-red-700 bg-red-100 p-2 rounded border-l-4 border-red-500">
                              <strong>Rejection Reason:</strong> {submission.adminNotes}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}