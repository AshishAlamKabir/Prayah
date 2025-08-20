import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Palette, 
  Music,
  Drama,
  Brush,
  FileText,
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Check,
  X,
  Search,
  Calendar,
  User,
  Receipt,
  Target
} from "lucide-react";

import type { CultureWingTransaction, CultureCategory } from "@shared/schema";

const TRANSACTION_TYPES = [
  { value: 'program_fee', label: 'Program Fee Collection', icon: DollarSign, color: 'text-green-600' },
  { value: 'instructor_payment', label: 'Instructor Payment', icon: User, color: 'text-blue-600' },
  { value: 'equipment_purchase', label: 'Equipment Purchase', icon: Receipt, color: 'text-red-600' },
  { value: 'venue_rental', label: 'Venue Rental', icon: Target, color: 'text-purple-600' },
  { value: 'performance_income', label: 'Performance Income', icon: TrendingUp, color: 'text-green-600' },
  { value: 'workshop_fee', label: 'Workshop Fee', icon: FileText, color: 'text-orange-600' },
  { value: 'maintenance', label: 'Maintenance Cost', icon: AlertTriangle, color: 'text-red-600' },
  { value: 'other', label: 'Other', icon: FileText, color: 'text-gray-600' }
];

const WING_ICONS = {
  Music: Music,
  Dance: User,
  Drama: Drama,
  Poetry: FileText,
  'Fine Arts': Brush,
  Default: Palette
};

export default function CultureWingAudit() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedWing, setSelectedWing] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterVerified, setFilterVerified] = useState<string>("all");

  // Fetch culture wings
  const { data: wings = [] } = useQuery<CultureCategory[]>({
    queryKey: ["/api/culture-categories"],
  });

  // Fetch transactions for selected wing
  const { data: transactions = [], isLoading } = useQuery<CultureWingTransaction[]>({
    queryKey: ["/api/culture-wing-audit", selectedWing],
    enabled: !!selectedWing,
  });

  // New transaction form state
  const [newTransaction, setNewTransaction] = useState({
    transactionType: '',
    amount: '',
    description: '',
    participantName: '',
    instructorName: '',
    programName: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/culture-wing-audit", {
        ...data,
        wingId: selectedWing,
        amount: parseFloat(data.amount)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Added",
        description: "Culture wing transaction has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/culture-wing-audit", selectedWing] });
      setShowAddForm(false);
      setNewTransaction({
        transactionType: '',
        amount: '',
        description: '',
        participantName: '',
        instructorName: '',
        programName: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add transaction.",
        variant: "destructive",
      });
    }
  });

  // Verify transaction mutation
  const verifyTransactionMutation = useMutation({
    mutationFn: async (transactionId: number) => {
      const response = await apiRequest("PATCH", `/api/culture-wing-audit/${transactionId}/verify`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transaction Verified",
        description: "Transaction has been verified successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/culture-wing-audit", selectedWing] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify transaction.",
        variant: "destructive",
      });
    }
  });

  // Calculate statistics for selected wing
  const calculateStats = () => {
    if (!transactions.length) return { totalIncome: 0, totalExpenses: 0, netBalance: 0, unverifiedCount: 0 };

    const income = transactions
      .filter((t: CultureWingTransaction) => ['program_fee', 'performance_income', 'workshop_fee'].includes(t.transactionType))
      .reduce((sum: number, t: CultureWingTransaction) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t: CultureWingTransaction) => !['program_fee', 'performance_income', 'workshop_fee'].includes(t.transactionType))
      .reduce((sum: number, t: CultureWingTransaction) => sum + t.amount, 0);

    const unverifiedCount = transactions.filter((t: CultureWingTransaction) => !t.verified).length;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
      unverifiedCount
    };
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction: CultureWingTransaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.participantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.instructorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.programName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || transaction.transactionType === filterType;
    const matchesVerified = filterVerified === "all" || 
                           (filterVerified === "verified" && transaction.verified) ||
                           (filterVerified === "unverified" && !transaction.verified);
    
    return matchesSearch && matchesType && matchesVerified;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWing || !newTransaction.transactionType || !newTransaction.amount || !newTransaction.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createTransactionMutation.mutate(newTransaction);
  };

  const stats = calculateStats();
  const selectedWingData = wings.find((w: CultureCategory) => w.id === selectedWing);
  const IconComponent = selectedWingData ? (WING_ICONS[selectedWingData.name as keyof typeof WING_ICONS] || WING_ICONS.Default) : WING_ICONS.Default;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Culture Wing Audit System</h2>
          <p className="text-gray-600">Manage financial records for each cultural wing separately</p>
        </div>
      </div>

      {/* Wing Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Select Cultural Wing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wings.map((wing: CultureCategory) => {
              const WingIcon = WING_ICONS[wing.name as keyof typeof WING_ICONS] || WING_ICONS.Default;
              const isSelected = selectedWing === wing.id;
              
              return (
                <Card 
                  key={wing.id} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected ? 'ring-2 ring-red-500 bg-red-50' : 'hover:shadow-lg'
                  }`}
                  onClick={() => setSelectedWing(wing.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <WingIcon className={`w-8 h-8 ${isSelected ? 'text-red-600' : 'text-gray-600'}`} />
                      <div>
                        <h3 className={`font-semibold ${isSelected ? 'text-red-900' : 'text-gray-900'}`}>
                          {wing.name}
                        </h3>
                        <p className={`text-sm ${isSelected ? 'text-red-700' : 'text-gray-600'}`}>
                          {wing.description?.substring(0, 50)}...
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Badge className="mt-2 bg-red-600">Selected</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Wing Audit Dashboard */}
      {selectedWing && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Income</p>
                    <p className="text-xl font-bold text-green-600">₹{stats.totalIncome.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600">₹{stats.totalExpenses.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className={`w-8 h-8 ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <p className="text-sm text-gray-600">Net Balance</p>
                    <p className={`text-xl font-bold ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{stats.netBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Unverified</p>
                    <p className="text-xl font-bold text-orange-600">{stats.unverifiedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wing Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <IconComponent className="w-6 h-6 text-red-600" />
                {selectedWingData?.name} Audit
                <Button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="ml-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Add Transaction Form */}
          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="transactionType">Transaction Type</Label>
                      <Select 
                        value={newTransaction.transactionType} 
                        onValueChange={(value) => setNewTransaction({...newTransaction, transactionType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                        <SelectContent>
                          {TRANSACTION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className={`w-4 h-4 ${type.color}`} />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newTransaction.date}
                        onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="programName">Program Name</Label>
                      <Input
                        id="programName"
                        value={newTransaction.programName}
                        onChange={(e) => setNewTransaction({...newTransaction, programName: e.target.value})}
                        placeholder="Related program/activity"
                      />
                    </div>

                    <div>
                      <Label htmlFor="participantName">Participant Name</Label>
                      <Input
                        id="participantName"
                        value={newTransaction.participantName}
                        onChange={(e) => setNewTransaction({...newTransaction, participantName: e.target.value})}
                        placeholder="Student/participant name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="instructorName">Instructor Name</Label>
                      <Input
                        id="instructorName"
                        value={newTransaction.instructorName}
                        onChange={(e) => setNewTransaction({...newTransaction, instructorName: e.target.value})}
                        placeholder="Instructor/staff name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                      placeholder="Detailed description of the transaction"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={newTransaction.notes}
                      onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})}
                      placeholder="Any additional notes or remarks"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTransactionMutation.isPending}
                    >
                      {createTransactionMutation.isPending ? "Adding..." : "Add Transaction"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Filters and Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {TRANSACTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterVerified} onValueChange={setFilterVerified}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions found for the selected filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Description</th>
                        <th className="text-left p-2">Amount</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction: CultureWingTransaction) => {
                        const transactionTypeData = TRANSACTION_TYPES.find(t => t.value === transaction.transactionType);
                        const isIncome = ['program_fee', 'performance_income', 'workshop_fee'].includes(transaction.transactionType);
                        
                        return (
                          <tr key={transaction.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {new Date(transaction.date).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                {transactionTypeData && (
                                  <transactionTypeData.icon className={`w-4 h-4 ${transactionTypeData.color}`} />
                                )}
                                <span className="text-sm">
                                  {transactionTypeData?.label || transaction.transactionType}
                                </span>
                              </div>
                            </td>
                            <td className="p-2">
                              <div>
                                <p className="font-medium">{transaction.description}</p>
                                {transaction.participantName && (
                                  <p className="text-sm text-gray-600">Participant: {transaction.participantName}</p>
                                )}
                                {transaction.programName && (
                                  <p className="text-sm text-gray-600">Program: {transaction.programName}</p>
                                )}
                              </div>
                            </td>
                            <td className="p-2">
                              <span className={`font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                                {isIncome ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                              </span>
                            </td>
                            <td className="p-2">
                              {transaction.verified ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <Check className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-orange-300 text-orange-600">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </td>
                            <td className="p-2">
                              {!transaction.verified && (
                                <Button
                                  size="sm"
                                  onClick={() => verifyTransactionMutation.mutate(transaction.id)}
                                  disabled={verifyTransactionMutation.isPending}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Verify
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}