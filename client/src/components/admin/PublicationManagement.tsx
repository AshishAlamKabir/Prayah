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
  Download, DollarSign, Send, User, Calendar, TrendingUp
} from "lucide-react";

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

  // Fetch publication submissions
  const { data: submissions = [], isLoading } = useQuery<PublicationSubmission[]>({
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
    const variants: Record<string, { variant: any; icon: any; label: string; color: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Pending Review", color: "bg-yellow-100 text-yellow-800" },
      approved: { variant: "default", icon: CheckCircle, label: "Approved", color: "bg-green-100 text-green-800" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected", color: "bg-red-100 text-red-800" },
      payment_pending: { variant: "outline", icon: DollarSign, label: "Payment Pending", color: "bg-blue-100 text-blue-800" },
      published: { variant: "default", icon: BookOpen, label: "Published", color: "bg-purple-100 text-purple-800" }
    };

    const config = variants[status] || variants.pending;
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </div>
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
    const notes = prompt("Add rejection reason:");
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

  // Group submissions by status for tabs
  const submissionsByStatus = {
    pending: (submissions as PublicationSubmission[]).filter((s) => s.status === 'pending'),
    approved: (submissions as PublicationSubmission[]).filter((s) => s.status === 'approved'),
    payment_pending: (submissions as PublicationSubmission[]).filter((s) => s.status === 'payment_pending'),
    rejected: (submissions as PublicationSubmission[]).filter((s) => s.status === 'rejected'),
    published: (submissions as PublicationSubmission[]).filter((s) => s.status === 'published'),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-600 to-green-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              Publication Management Center
            </h1>
            <p className="text-red-100 mt-2 text-lg">Review, approve, and manage manuscript submissions for publication</p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{submissionsByStatus.pending.length}</div>
              <div className="text-red-100 text-sm">Awaiting Review</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">{submissionsByStatus.published.length}</div>
              <div className="text-red-100 text-sm">Published Works</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(submissionsByStatus).map(([status, statusSubmissions]) => {
          const statusConfig = {
            pending: { color: "border-yellow-200 bg-yellow-50", icon: Clock, label: "Pending Review" },
            approved: { color: "border-green-200 bg-green-50", icon: CheckCircle, label: "Approved" },
            payment_pending: { color: "border-blue-200 bg-blue-50", icon: DollarSign, label: "Payment Due" },
            rejected: { color: "border-red-200 bg-red-50", icon: XCircle, label: "Rejected" },
            published: { color: "border-purple-200 bg-purple-50", icon: BookOpen, label: "Published" }
          };
          
          const config = statusConfig[status as keyof typeof statusConfig];
          const IconComponent = config.icon;
          
          return (
            <Card key={status} className={`${config.color} border-2`}>
              <CardContent className="p-4 text-center">
                <IconComponent className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                <div className="text-2xl font-bold text-gray-900">{statusSubmissions.length}</div>
                <div className="text-sm text-gray-600">{config.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 bg-gray-100 p-1 rounded-xl h-14">
          {Object.entries(submissionsByStatus).map(([status, statusSubmissions]) => {
            const statusConfig = {
              pending: { icon: Clock, label: "Pending", color: "data-[state=active]:bg-yellow-500 data-[state=active]:text-white" },
              approved: { icon: CheckCircle, label: "Approved", color: "data-[state=active]:bg-green-500 data-[state=active]:text-white" },
              payment_pending: { icon: DollarSign, label: "Payment", color: "data-[state=active]:bg-blue-500 data-[state=active]:text-white" },
              rejected: { icon: XCircle, label: "Rejected", color: "data-[state=active]:bg-red-500 data-[state=active]:text-white" },
              published: { icon: BookOpen, label: "Published", color: "data-[state=active]:bg-purple-500 data-[state=active]:text-white" }
            };
            
            const config = statusConfig[status as keyof typeof statusConfig];
            const IconComponent = config.icon;
            
            return (
              <TabsTrigger 
                key={status}
                value={status} 
                className={`flex flex-col items-center gap-1 py-2 rounded-lg ${config.color}`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-xs font-medium">{config.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {statusSubmissions.length}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab Contents */}
        {Object.entries(submissionsByStatus).map(([status, statusSubmissions]) => (
          <TabsContent key={status} value={status} className="space-y-4 mt-6">
            {statusSubmissions.length === 0 ? (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No {status.replace('_', ' ')} submissions
                  </h3>
                  <p className="text-gray-600 text-center max-w-md leading-relaxed">
                    {status === 'pending' && "New manuscript submissions will appear here for your review and approval."}
                    {status === 'approved' && "Approved manuscripts awaiting author payment will be listed here."}
                    {status === 'payment_pending' && "Manuscripts with pending payments will appear here."}
                    {status === 'rejected' && "Rejected submissions will be shown here for reference."}
                    {status === 'published' && "Successfully published works will be displayed here."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {statusSubmissions.map((submission: PublicationSubmission) => (
                  <Card key={submission.id} className="border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gray-50 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-4">
                            <CardTitle className="text-xl text-gray-900 font-bold">{submission.title}</CardTitle>
                            {getStatusBadge(submission.status)}
                          </div>
                          <div className="flex items-center gap-8 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span className="font-medium">{submission.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(submission.submittedAt).toLocaleDateString('en-IN')}</span>
                            </div>
                            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {submission.category}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6 p-6">
                      <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <label className="text-sm font-semibold text-gray-700 block mb-2">Manuscript Description</label>
                        <p className="text-gray-600 leading-relaxed">{submission.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <label className="text-sm font-semibold text-gray-700">Author Contact</label>
                          <p className="text-gray-600 mt-1">{submission.email}</p>
                        </div>
                        {submission.publicationFee && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <label className="text-sm font-semibold text-green-700">Publication Fee</label>
                            <p className="text-2xl font-bold text-green-600 mt-1">₹{submission.publicationFee}</p>
                          </div>
                        )}
                      </div>

                      {submission.adminNotes && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <label className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4" />
                            Admin Review Notes
                          </label>
                          <p className="text-blue-800 leading-relaxed">{submission.adminNotes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="default"
                            className="flex items-center gap-2 hover:bg-blue-50 border-blue-200"
                            onClick={() => window.open(submission.pdfUrl, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                            Preview PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="default"
                            className="flex items-center gap-2 hover:bg-gray-50"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = submission.pdfUrl;
                              link.download = `${submission.title}.pdf`;
                              link.click();
                            }}
                          >
                            <Download className="w-4 h-4" />
                            Download PDF
                          </Button>
                        </div>

                        {submission.status === 'pending' && (
                          <div className="flex gap-3">
                            <Button
                              size="default"
                              onClick={() => handleApprove(submission)}
                              disabled={approveSubmissionMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-6"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve & Set Fee
                            </Button>
                            <Button
                              variant="destructive"
                              size="default"
                              onClick={() => handleReject(submission)}
                              disabled={rejectSubmissionMutation.isPending}
                              className="flex items-center gap-2 px-6"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {submission.status === 'approved' && (
                          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                            <Send className="w-4 h-4" />
                            <span className="font-medium">Payment link sent to author</span>
                          </div>
                        )}

                        {submission.status === 'published' && (
                          <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-4 py-2 rounded-lg border border-purple-200">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-medium">Successfully published</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}