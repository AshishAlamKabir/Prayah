import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

const manualFeePaymentSchema = z.object({
  schoolId: z.number(),
  studentName: z.string().min(1, "Student name is required"),
  studentRollNo: z.string().min(1, "Roll number is required"),
  studentClass: z.string().min(1, "Class is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  feeMonth: z.string().min(1, "Fee month is required"),
  paymentMethod: z.enum(["cash", "cheque", "demand_draft", "other"]),
  transactionReference: z.string().optional(),
  remarks: z.string().optional(),
});

type ManualFeePaymentFormData = z.infer<typeof manualFeePaymentSchema>;

interface AddManualFeePaymentDialogProps {
  schoolId: number;
}

export default function AddManualFeePaymentDialog({
  schoolId,
}: AddManualFeePaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ManualFeePaymentFormData>({
    resolver: zodResolver(manualFeePaymentSchema),
    defaultValues: {
      schoolId,
      studentName: "",
      studentRollNo: "",
      studentClass: "",
      amount: 0,
      feeMonth: "",
      paymentMethod: "cash",
      transactionReference: "",
      remarks: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ManualFeePaymentFormData) => {
      return await apiRequest({
        url: "/api/fee-payments/manual",
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fee-payments"] });
      toast({
        title: "Success",
        description: "Manual fee payment record added successfully",
      });
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add manual fee payment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ManualFeePaymentFormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-manual-payment">
          <Plus className="w-4 h-4 mr-2" />
          Add Manual Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Manual Fee Payment</DialogTitle>
          <DialogDescription>
            Record a fee payment made through cash, cheque, or other offline
            methods.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter student name"
                        data-testid="input-student-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentRollNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter roll number"
                        data-testid="input-roll-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="studentClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Class 10"
                        data-testid="input-class"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feeMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Month</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="month"
                        data-testid="input-fee-month"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="Enter amount"
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                        data-testid="input-amount"
                      />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-payment-method">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="demand_draft">
                          Demand Draft
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="transactionReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Reference (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Cheque number, DD number, etc."
                      data-testid="input-transaction-reference"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Any additional notes"
                      data-testid="input-remarks"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                data-testid="button-submit"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Payment"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
