import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Smartphone, Building2 } from "lucide-react";

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
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

export default function RazorpayCheckout({
  paymentType,
  amount,
  description,
  orderId,
  publicationSubmissionId,
  schoolId,
  cultureId,
  onSuccess,
  onCancel
}: RazorpayCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const createOrder = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await apiRequest("POST", "/api/razorpay/create-order", {
        amount,
        paymentType,
        description: description || `${paymentType.replace('_', ' ')} payment`,
        orderId,
        publicationSubmissionId,
        schoolId,
        cultureId,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create payment order');
      }

      setOrderDetails(data);
      return data;
    } catch (error: any) {
      console.error('Error creating payment order:', error);
      setError(error.message || 'Failed to initialize payment');
      toast({
        title: "Payment Setup Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      const order = orderDetails || await createOrder();
      if (!order) return;

      if (!window.Razorpay) {
        toast({
          title: "Payment Error",
          description: "Payment system not loaded. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Prayas",
        description: order.description,
        order_id: order.orderId,
        prefill: {
          name: order.customerName,
          email: order.customerEmail,
        },
        theme: {
          color: "#d32f2f",
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyResponse = await apiRequest("POST", "/api/razorpay/verify-payment", {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.success) {
              toast({
                title: "Payment Successful!",
                description: "Your payment has been processed successfully.",
              });
              
              if (onSuccess) {
                onSuccess();
              }
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Payment verification failed. Please contact support.",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: function() {
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
              variant: "destructive",
            });
            if (onCancel) {
              onCancel();
            }
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred while processing payment.",
        variant: "destructive",
      });
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getPaymentMethodIcons = () => (
    <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Smartphone className="h-4 w-4" />
        <span>UPI</span>
      </div>
      <div className="flex items-center gap-1">
        <CreditCard className="h-4 w-4" />
        <span>Cards</span>
      </div>
      <div className="flex items-center gap-1">
        <Building2 className="h-4 w-4" />
        <span>Net Banking</span>
      </div>
    </div>
  );

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-red-600">{error}</div>
            <div className="space-x-2">
              <Button onClick={createOrder} variant="outline">
                Try Again
              </Button>
              {onCancel && (
                <Button onClick={onCancel} variant="secondary">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Complete Payment</CardTitle>
        <CardDescription>
          {description || `Pay for ${paymentType.replace('_', ' ')}`}
        </CardDescription>
        <div className="text-3xl font-bold text-green-600">
          {formatAmount(amount)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Payment Methods Available:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• UPI (Google Pay, PhonePe, Paytm, BHIM)</li>
            <li>• Credit & Debit Cards</li>
            <li>• Net Banking (All major banks)</li>
            <li>• Wallets (Paytm, Mobikwik, etc.)</li>
          </ul>
        </div>

        <Button 
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting up payment...
            </>
          ) : (
            <>
              Pay {formatAmount(amount)}
            </>
          )}
        </Button>

        {getPaymentMethodIcons()}

        {onCancel && (
          <Button 
            onClick={onCancel} 
            variant="ghost" 
            className="w-full"
          >
            Cancel
          </Button>
        )}

        <div className="text-xs text-center text-muted-foreground">
          Secured by Razorpay • Your payment information is encrypted and secure
        </div>
      </CardContent>
    </Card>
  );
}