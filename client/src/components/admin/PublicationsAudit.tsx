import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  CheckCircle,
  FileText,
  Calculator,
  BookOpen,
  Users,
  PenTool,
} from "lucide-react";

// Schema for adding new publication transactions
const publicationTransactionSchema = z.object({
  transactionType: z.enum(["revenue", "expense", "commission", "refund"]),
  category: z.enum(["submission_fee", "review_fee", "publication_fee", "printing_cost", "marketing", "author_royalty", "commission", "refund"]),
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  authorName: z.string().optional(),
  manuscriptTitle: z.string().optional(),
  vendorName: z.string().optional(),
  invoiceNumber: z.string().optional(),
  paymentMethod: z.enum(["cash", "card", "upi", "bank_transfer"]).optional(),
  notes: z.string().optional(),
});

type PublicationTransactionFormData = z.infer<typeof publicationTransactionSchema>;

interface PublicationTransaction {
  id: number;
  transactionType: string;
  category: string;
  submissionId?: number;
  description: string;
  amount: string;
  currency: string;
  authorName?: string;
  manuscriptTitle?: string;
  vendorName?: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  notes?: string;
  isVerified: boolean;
  verifiedBy?: number;
  verifiedAt?: string;
  recordedBy: number;
  createdAt: string;
  updatedAt: string;
  recordedByUser?: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
  verifiedByUser?: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

export default function PublicationsAudit() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<PublicationTransactionFormData>({
    resolver: zodResolver(publicationTransactionSchema),
    defaultValues: {
      transactionType: "revenue",
      category: "submission_fee",
      description: "",
      amount: "",
      paymentMethod: "upi",
    },
  });

  // Fetch publication transactions
  const { data: transactions = [], isLoading } = useQuery<PublicationTransaction[]>({
    queryKey: ["/api/publications-audit"],
  });

  // Calculate statistics
  const stats = {
    totalRevenue: transactions
      .filter((t: PublicationTransaction) => t.transactionType === "revenue")
      .reduce((sum: number, t: PublicationTransaction) => sum + parseFloat(t.amount), 0),
    totalExpenses: transactions
      .filter((t: PublicationTransaction) => ["expense", "commission"].includes(t.transactionType))
      .reduce((sum: number, t: PublicationTransaction) => sum + parseFloat(t.amount), 0),
    totalTransactions: transactions.length,
    unverifiedTransactions: transactions.filter((t: PublicationTransaction) => !t.isVerified).length,
    netProfit: 0,
  };
  
  stats.netProfit = stats.totalRevenue - stats.totalExpenses;

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction: PublicationTransaction) => {
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.authorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.manuscriptTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || transaction.transactionType === typeFilter;
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
    const matchesVerification = 
      verificationFilter === "all" || 
      (verificationFilter === "verified" && transaction.isVerified) ||
      (verificationFilter === "unverified" && !transaction.isVerified);

    return matchesSearch && matchesType && matchesCategory && matchesVerification;
  });

  // Add transaction mutation
  const addTransactionMutation = useMutation({
    mutationFn: async (data: PublicationTransactionFormData) => {
      const response = await apiRequest("POST", "/api/publications-audit", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publications-audit"] });
      toast({
        title: "Success",
        description: "Publication transaction added successfully",
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify transaction mutation
  const verifyTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const response = await apiRequest("PATCH", `/api/publications-audit/${transactionId}/verify`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publications-audit"] });
      toast({
        title: "Success",
        description: "Transaction verified successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "revenue":
        return "bg-green-100 text-green-800 border-green-200";
      case "expense":
        return "bg-red-100 text-red-800 border-red-200";
      case "commission":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "refund":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryNames: Record<string, string> = {
      submission_fee: "Submission Fee",
      review_fee: "Review Fee", 
      publication_fee: "Publication Fee",
      printing_cost: "Printing Cost",
      marketing: "Marketing",
      author_royalty: "Author Royalty",
      commission: "Commission",
      refund: "Refund",
    };
    return categoryNames[category] || category;
  };

  const onSubmit = (data: PublicationTransactionFormData) => {
    addTransactionMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Publications Audit</h2>
          <p className="text-muted-foreground">
            Track all financial transactions for publication services
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
              <DialogDescription>
                Record a new financial transaction for publications
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="transactionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="revenue">Revenue</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="commission">Commission</SelectItem>
                            <SelectItem value="refund">Refund</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="submission_fee">Submission Fee</SelectItem>
                            <SelectItem value="review_fee">Review Fee</SelectItem>
                            <SelectItem value="publication_fee">Publication Fee</SelectItem>
                            <SelectItem value="printing_cost">Printing Cost</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="author_royalty">Author Royalty</SelectItem>
                            <SelectItem value="commission">Commission</SelectItem>
                            <SelectItem value="refund">Refund</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Transaction description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Author Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manuscriptTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manuscript Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes (optional)" 
                          className="min-h-[60px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={addTransactionMutation.isPending}>
                    {addTransactionMutation.isPending ? "Adding..." : "Add Transaction"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">₹{stats.totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{stats.netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <PenTool className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unverified</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unverifiedTransactions}</p>
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
                  placeholder="Search by description, author, manuscript, vendor, or invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expenses</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="submission_fee">Submission Fee</SelectItem>
                  <SelectItem value="review_fee">Review Fee</SelectItem>
                  <SelectItem value="publication_fee">Publication Fee</SelectItem>
                  <SelectItem value="printing_cost">Printing Cost</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="author_royalty">Author Royalty</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>

              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Publication Transactions</CardTitle>
          <CardDescription>
            All publication-related financial transactions ({filteredTransactions.length} records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading transactions...</p>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || typeFilter !== "all" || categoryFilter !== "all" || verificationFilter !== "all"
                  ? "Try adjusting your search criteria."
                  : "Get started by adding your first publication transaction."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Author/Vendor</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recorded By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction: PublicationTransaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {format(new Date(transaction.createdAt), "MMM dd, yyyy")}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(transaction.createdAt), "hh:mm a")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTransactionTypeColor(transaction.transactionType)}>
                          {transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getCategoryDisplayName(transaction.category)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          {transaction.manuscriptTitle && (
                            <div className="text-sm text-gray-500">
                              Manuscript: {transaction.manuscriptTitle}
                            </div>
                          )}
                          {transaction.invoiceNumber && (
                            <div className="text-sm text-gray-500">
                              Invoice: {transaction.invoiceNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-semibold ${
                          transaction.transactionType === "revenue" ? "text-green-600" : "text-red-600"
                        }`}>
                          {transaction.transactionType === "revenue" ? "+" : "-"}₹{parseFloat(transaction.amount).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.authorName || transaction.vendorName || "-"}
                      </TableCell>
                      <TableCell>
                        {transaction.paymentMethod ? (
                          <span className="capitalize">{transaction.paymentMethod.replace("_", " ")}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.isVerified ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-orange-200 text-orange-800">
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {transaction.recordedByUser?.firstName && transaction.recordedByUser?.lastName
                              ? `${transaction.recordedByUser.firstName} ${transaction.recordedByUser.lastName}`
                              : transaction.recordedByUser?.username}
                          </div>
                          {transaction.isVerified && transaction.verifiedByUser && (
                            <div className="text-sm text-gray-500">
                              Verified by: {transaction.verifiedByUser.firstName && transaction.verifiedByUser.lastName
                                ? `${transaction.verifiedByUser.firstName} ${transaction.verifiedByUser.lastName}`
                                : transaction.verifiedByUser.username}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!transaction.isVerified && (
                            <Button
                              size="sm"
                              onClick={() => verifyTransactionMutation.mutate(transaction.id)}
                              disabled={verifyTransactionMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
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
    </div>
  );
}