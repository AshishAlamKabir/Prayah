import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Building2, Globe } from "lucide-react";
import RazorpayCheckout from "@/pages/RazorpayCheckout";
import Checkout from "@/pages/Checkout";

interface PaymentMethodSelectorProps {
  paymentType: 'book_purchase' | 'subscription' | 'publication_fee' | 'school_fee' | 'culture_program';
  amount: number;
  description?: string;
  orderId?: number;
  publicationSubmissionId?: number;
  schoolId?: number;
  cultureId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentMethodSelector({
  paymentType,
  amount,
  description,
  orderId,
  publicationSubmissionId,
  schoolId,
  cultureId,
  onSuccess,
  onCancel
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<'razorpay' | 'stripe' | null>(null);

  if (selectedMethod === 'razorpay') {
    return (
      <RazorpayCheckout
        paymentType={paymentType}
        amount={amount}
        description={description}
        orderId={orderId}
        publicationSubmissionId={publicationSubmissionId}
        schoolId={schoolId}
        cultureId={cultureId}
        onSuccess={onSuccess}
        onCancel={() => setSelectedMethod(null)}
      />
    );
  }

  if (selectedMethod === 'stripe') {
    return (
      <Checkout
        paymentType={paymentType}
        amount={amount}
        description={description}
        orderId={orderId}
        publicationSubmissionId={publicationSubmissionId}
        schoolId={schoolId}
        cultureId={cultureId}
        onSuccess={onSuccess}
        onCancel={() => setSelectedMethod(null)}
      />
    );
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Choose Payment Method</CardTitle>
          <CardDescription>
            Select your preferred payment method to pay {formatAmount(amount)}
          </CardDescription>
          <div className="text-2xl font-bold text-green-600">
            {formatAmount(amount)}
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Razorpay - India Focused */}
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Razorpay</CardTitle>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Recommended for India
              </Badge>
            </div>
            <CardDescription>
              Best for Indian customers with UPI, cards, and net banking
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <span>UPI Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-purple-600" />
                <span>All Cards</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-600" />
                <span>Net Banking</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-600" />
                <span>Wallets</span>
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-green-800 mb-1">Benefits:</div>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• One-click UPI payments</li>
                <li>• Instant settlements</li>
                <li>• Lower transaction fees</li>
                <li>• Support for all Indian payment methods</li>
              </ul>
            </div>

            <Button 
              onClick={() => setSelectedMethod('razorpay')}
              className="w-full"
              size="lg"
            >
              Pay with Razorpay
            </Button>
          </CardContent>
        </Card>

        {/* Stripe - International */}
        <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Stripe</CardTitle>
              <Badge variant="outline">
                International
              </Badge>
            </div>
            <CardDescription>
              Global payment processing with international card support
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>International Cards</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-600" />
                <span>Global Coverage</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-600" />
                <span>Bank Transfers</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-600" />
                <span>Digital Wallets</span>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">Benefits:</div>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Global payment acceptance</li>
                <li>• Advanced fraud protection</li>
                <li>• Multi-currency support</li>
                <li>• Enterprise-grade security</li>
              </ul>
            </div>

            <Button 
              onClick={() => setSelectedMethod('stripe')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Pay with Stripe
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        {onCancel && (
          <Button onClick={onCancel} variant="ghost">
            Cancel Payment
          </Button>
        )}
      </div>

      <div className="text-xs text-center text-muted-foreground">
        All payments are secured with bank-level encryption. Your payment information is never stored on our servers.
      </div>
    </div>
  );
}