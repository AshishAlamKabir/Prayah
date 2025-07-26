import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, Upload, FileText, Clock, CheckCircle, XCircle, 
  User, Calendar, DollarSign, Send, AlertCircle, Star,
  ArrowRight, Download, Eye, Mail
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  adminNotes?: string;
  publicationFee?: number;
}

export default function BookPublication() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    author: user?.username || "",
    email: user?.email || "",
    category: "",
    description: "",
  });

  // Fetch user's submissions
  const { data: userSubmissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ["/api/publication-submissions", user?.id],
    enabled: !!user,
  });

  // Submit manuscript mutation
  const submitMutation = useMutation({
    mutationFn: async (submissionData: FormData) => {
      return await apiRequest("POST", "/api/publication-submissions", submissionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publication-submissions"] });
      toast({
        title: "Submission Successful!",
        description: "Your manuscript has been submitted for review. You'll receive an email notification once reviewed.",
      });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Failed to submit your manuscript. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      author: user?.username || "",
      email: user?.email || "",
      category: "",
      description: "",
    });
    setPdfFile(null);
    setIsSubmitting(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: "File Too Large",
          description: "Please upload a PDF file smaller than 50MB.",
          variant: "destructive",
        });
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit your manuscript.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.category || !formData.description || !pdfFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload your PDF manuscript.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const submissionData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submissionData.append(key, value);
    });
    submissionData.append("pdfFile", pdfFile);

    submitMutation.mutate(submissionData);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string; color: string }> = {
      pending: { variant: "secondary", icon: Clock, label: "Under Review", color: "text-yellow-600" },
      approved: { variant: "default", icon: CheckCircle, label: "Approved", color: "text-green-600" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected", color: "text-red-600" },
      payment_pending: { variant: "outline", icon: DollarSign, label: "Payment Required", color: "text-blue-600" },
      published: { variant: "default", icon: BookOpen, label: "Published", color: "text-purple-600" }
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <BookOpen className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">Please log in to submit your manuscript for publication.</p>
            <Button onClick={() => window.location.href = '/login'} className="w-full">
              Log In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Prayas Publications</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Share your knowledge with the world. Submit your manuscript for publication through Prayas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submission Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-green-600" />
                  Submit Your Manuscript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="title">Book Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter your book title"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fiction">Fiction</SelectItem>
                          <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                          <SelectItem value="poetry">Poetry</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="children">Children's Books</SelectItem>
                          <SelectItem value="biography">Biography</SelectItem>
                          <SelectItem value="history">History</SelectItem>
                          <SelectItem value="culture">Culture & Arts</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="author">Author Name *</Label>
                      <Input
                        id="author"
                        value={formData.author}
                        onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="Your name as it should appear on the book"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Contact Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Your email address"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Book Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Provide a detailed description of your book, target audience, and key themes"
                      rows={6}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="pdfFile">Upload Manuscript (PDF) *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Upload your complete manuscript in PDF format</p>
                        <p className="text-sm text-gray-500 mb-4">Maximum file size: 50MB</p>
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="max-w-xs mx-auto"
                          required
                        />
                      </div>
                    </div>
                    
                    {pdfFile && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            <strong>Selected:</strong> {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-2">Submission Guidelines:</p>
                        <ul className="space-y-1 text-sm">
                          <li>• Manuscript should be complete and properly formatted</li>
                          <li>• PDF file must be under 50MB in size</li>
                          <li>• Review process typically takes 5-7 business days</li>
                          <li>• Publication fees will be communicated upon approval</li>
                          <li>• You'll receive email notifications about your submission status</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || submitMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting || submitMutation.isPending ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Submitting Manuscript...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Publication Info & User Submissions */}
          <div className="space-y-6">
            {/* Publication Process */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-green-600" />
                  Publication Process
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Submit Manuscript</h4>
                    <p className="text-sm text-gray-600">Upload your complete PDF manuscript with details</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-yellow-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Editorial Review</h4>
                    <p className="text-sm text-gray-600">Our team reviews your manuscript (5-7 days)</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-green-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Payment & Production</h4>
                    <p className="text-sm text-gray-600">Pay publication fee and we begin production</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Publication</h4>
                    <p className="text-sm text-gray-600">Your book is published and distributed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Submissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Your Submissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="text-center py-4">
                    <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                    <p className="text-sm text-gray-600">Loading submissions...</p>
                  </div>
                ) : !Array.isArray(userSubmissions) || userSubmissions.length === 0 ? (
                  <div className="text-center py-6">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No submissions yet</p>
                    <p className="text-xs text-gray-500">Your submitted manuscripts will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(userSubmissions as PublicationSubmission[]).map((submission) => (
                      <div key={submission.id} className="border rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{submission.title}</h4>
                          {getStatusBadge(submission.status)}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>

                        {submission.status === 'payment_pending' && (
                          <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 mb-2">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              Payment Required: ₹{submission.publicationFee}
                            </div>
                            <Button size="sm" className="mt-2 w-full text-xs h-6">
                              Pay Now
                            </Button>
                          </div>
                        )}

                        {submission.status === 'rejected' && submission.adminNotes && (
                          <div className="bg-red-50 p-2 rounded text-xs text-red-800">
                            <strong>Feedback:</strong> {submission.adminNotes}
                          </div>
                        )}

                        {submission.status === 'published' && (
                          <div className="bg-green-50 p-2 rounded text-xs text-green-800">
                            ✓ Successfully published by Prayas!
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}