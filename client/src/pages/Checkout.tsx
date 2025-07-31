import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Initialize Stripe
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface CheckoutFormProps {
  paymentType: string;
  amount: number;
  description: string;
  metadata?: Record<string, any>;
  onSuccess?: () => void;
}

function CheckoutForm({ paymentType, amount, description, metadata, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        console.error('Payment error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment processing.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully!",
        });
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
}

interface CheckoutProps {
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

export default function Checkout({
  paymentType,
  amount,
  description,
  orderId,
  publicationSubmissionId,
  schoolId,
  cultureId,
  onSuccess,
  onCancel
}: CheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await apiRequest("POST", "/api/payments/create-intent", {
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
        throw new Error(data.message || 'Failed to create payment intent');
      }

      setClientSecret(data.clientSecret);
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      setError(error.message || 'Failed to initialize payment');
      toast({
        title: "Payment Setup Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!stripePromise) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Payment system is not configured. Please contact support.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Setting up payment...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="text-red-600">{error}</div>
            <div className="space-x-2">
              <Button onClick={createPaymentIntent} variant="outline">
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

  if (!clientSecret) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-gray-600">
            Unable to initialize payment. Please refresh and try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#d32f2f',
    },
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
        <CardDescription>
          {description || `Pay for ${paymentType.replace('_', ' ')}`}
        </CardDescription>
        <div className="text-2xl font-bold text-green-600">
          ${amount.toFixed(2)}
        </div>
      </CardHeader>
      <CardContent>
        <Elements 
          stripe={stripePromise} 
          options={{ 
            clientSecret,
            appearance 
          }}
        >
          <CheckoutForm
            paymentType={paymentType}
            amount={amount}
            description={description || ''}
            onSuccess={onSuccess}
          />
        </Elements>
        {onCancel && (
          <Button 
            onClick={onCancel} 
            variant="ghost" 
            className="w-full mt-4"
          >
            Cancel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}