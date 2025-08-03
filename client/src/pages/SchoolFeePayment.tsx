import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { AlertCircle, School, CreditCard, CheckCircle2, Receipt, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Fee payment form schema
const feePaymentSchema = z.object({
  schoolId: z.number({ required_error: "Please select a school" }),
  studentRollNo: z.string().min(1, "Roll number is required"),
  studentName: z.string().min(2, "Student name must be at least 2 characters"),
  studentClass: z.string().min(1, "Class is required"),
  feeMonth: z.string().min(1, "Fee month is required"),
  amount: z.string().min(1, "Amount is required").transform((val) => parseFloat(val)),
});

type FeePaymentForm = z.infer<typeof feePaymentSchema>;

export default function SchoolFeePayment() {
  const [, params] = useRoute("/schools/:schoolId/fee-payment");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [paymentStep, setPaymentStep] = useState<"form" | "payment" | "success">("form");
  const [paymentData, setPaymentData] = useState<any>(null);

  const schoolId = params?.schoolId ? parseInt(params.schoolId) : null;

  // Get schools list
  const { data: schools = [] } = useQuery({
    queryKey: ["/api/schools"],
  });

  // Get specific school if ID is provided
  const { data: school } = useQuery({
    queryKey: ["/api/schools", schoolId],
    enabled: !!schoolId,
  });

  const form = useForm<FeePaymentForm>({
    resolver: zodResolver(feePaymentSchema),
    defaultValues: {
      schoolId: schoolId || undefined,
      studentRollNo: "",
      studentName: "",
      studentClass: "",
      feeMonth: "",
      amount: 0,
    },
  });

  // Create payment order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: FeePaymentForm) => {
      return apiRequest("POST", "/api/fee-payments/create-order", data);
    },
    onSuccess: (data) => {
      setPaymentData(data);
      setPaymentStep("payment");
      initializeRazorpay(data);
    },
    onError: (error: any) => {
      toast({
        title: "Payment Order Failed",
        description: error.message || "Failed to create payment order",
        variant: "destructive",
      });
    },
  });

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentDetails: any) => {
      return apiRequest("POST", "/api/fee-payments/verify-payment", paymentDetails);
    },
    onSuccess: () => {
      setPaymentStep("success");
      toast({
        title: "Payment Successful",
        description: "Your fee payment has been processed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Verification Failed",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
      setPaymentStep("form");
    },
  });

  // Initialize Razorpay payment
  const initializeRazorpay = (orderData: any) => {
    if (!window.Razorpay) {
      toast({
        title: "Payment Gateway Error",
        description: "Razorpay is not loaded. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Prayas Fee Payment",
      description: `Fee payment for ${orderData.studentDetails.name}`,
      order_id: orderData.orderId,
      handler: (response: any) => {
        verifyPaymentMutation.mutate({
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
          feePaymentId: orderData.feePaymentId,
        });
      },
      prefill: {
        name: user?.firstName + " " + user?.lastName,
        email: user?.email,
      },
      notes: {
        school: orderData.schoolName,
        student: orderData.studentDetails.name,
        rollNo: orderData.studentDetails.rollNo,
        feeMonth: orderData.studentDetails.feeMonth,
      },
      theme: {
        color: "#dc2626", // Red theme for Prayas
      },
      modal: {
        ondismiss: () => {
          setPaymentStep("form");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const onSubmit = (data: FeePaymentForm) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a payment",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate(data);
  };

  const generateMonthOptions = () => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const currentYear = new Date().getFullYear();
    const options = [];

    // Add current year and next year options
    for (let year = currentYear - 1; year <= currentYear + 1; year++) {
      months.forEach(month => {
        options.push(`${month} ${year}`);
      });
    }

    return options;
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to be logged in to make a fee payment. Please log in first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (paymentStep === "success") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-green-600">Payment Successful!</CardTitle>
            <CardDescription>
              Your fee payment has been processed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                You will receive a confirmation email shortly
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => setPaymentStep("form")}
                  variant="outline"
                  className="w-full"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Make Another Payment
                </Button>
                <Button 
                  onClick={() => window.location.href = "/schools"}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Schools
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">School Fee Payment</h1>
          <p className="text-gray-600">
            Pay your school fees securely through our online payment portal
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <School className="h-5 w-5 mr-2" />
              Fee Payment Form
            </CardTitle>
            <CardDescription>
              Fill in the student details and fee information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="schoolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a school" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schools.map((school: any) => (
                            <SelectItem key={school.id} value={school.id.toString()}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="studentRollNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Roll Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter roll number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="studentClass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter class" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="studentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter student's full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="feeMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Month *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fee month" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {generateMonthOptions().map((month) => (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Amount (₹) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter amount" 
                            min="1"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please ensure all details are correct before proceeding. 
                    Duplicate payments for the same month will be rejected.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createOrderMutation.isPending || paymentStep === "payment"}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {createOrderMutation.isPending ? "Processing..." : 
                   paymentStep === "payment" ? "Payment in Progress..." : 
                   "Pay Fee"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}