import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CreditCard, Smartphone, Coins } from "lucide-react";

interface PaymentSummaryProps {
  schoolId: number;
  summary?: {
    totalAmount: number;
    totalPayments: number;
    paymentsByMode: Record<string, { count: number; amount: number }>;
    recentPayments: any[];
  } | null;
}

export default function PaymentSummary({ schoolId, summary }: PaymentSummaryProps) {
  if (!summary) {
    return (
      <div className="text-center py-4 text-gray-500">
        No payment data available
      </div>
    );
  }

  const getPaymentModeIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'cash':
        return <Coins className="h-4 w-4" />;
      case 'website':
      case 'online':
        return <CreditCard className="h-4 w-4" />;
      case 'upi':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentModeColor = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'cash':
        return 'bg-green-100 text-green-800';
      case 'website':
      case 'online':
        return 'bg-blue-100 text-blue-800';
      case 'upi':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">₹{summary.totalAmount?.toLocaleString() || 0}</div>
          <div className="text-sm text-gray-600">Total Collection</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{summary.totalPayments || 0}</div>
          <div className="text-sm text-gray-600">Total Payments</div>
        </div>
      </div>

      {/* Payment Modes Breakdown */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Payment Mode Breakdown</h4>
        {Object.entries(summary.paymentsByMode || {}).map(([mode, data]) => (
          <div key={mode} className="flex items-center justify-between p-3 bg-white border rounded-lg">
            <div className="flex items-center space-x-3">
              {getPaymentModeIcon(mode)}
              <span className="font-medium capitalize">{mode}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className={getPaymentModeColor(mode)}>
                {data.count} payments
              </Badge>
              <span className="font-medium">₹{data.amount?.toLocaleString() || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {summary.paymentsByMode && Object.keys(summary.paymentsByMode).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No payment data available for this school
        </div>
      )}
    </div>
  );
}