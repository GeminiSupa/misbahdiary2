"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recordPayment } from "@/app/(app)/cases/[id]/actions";
import { paymentSchema, type PaymentFormValues } from "@/lib/validation/payments";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  DollarSign,
  Calendar,
  CreditCard,
  FileText,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentFormProps = {
  matterId: string;
  currentTotal?: number;
  currentPaid?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function PaymentForm({ matterId, currentTotal = 0, currentPaid = 0, onSuccess, onCancel }: PaymentFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pending = Math.max(currentTotal - currentPaid, 0);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      matterId,
      amount: pending > 0 ? pending : undefined,
      date: new Date().toISOString().slice(0, 10),
      method: "",
      notes: "",
    },
  });

  const onSubmit = async (values: PaymentFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("matterId", values.matterId);
    formData.append("amount", values.amount.toString());
    formData.append("date", values.date);
    if (values.method) formData.append("method", values.method);
    if (values.notes) formData.append("notes", values.notes);

    const result = await recordPayment(formData);

    if (result.success) {
      form.reset({
        matterId,
        amount: undefined,
        date: new Date().toISOString().slice(0, 10),
        method: "",
        notes: "",
      });
      router.refresh();
      onSuccess?.();
      setIsSubmitting(false);
      return;
    }

    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([key, messages]) => {
        const message = messages?.[0];
        if (message) {
          form.setError(key as keyof PaymentFormValues, {
            type: "server",
            message,
          });
        }
      });
    }

    if (result.message) {
      setFormError(result.message);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <AlertTitle>Unable to record payment</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {/* Summary Card */}
      <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Fee Total</span>
            <span className="font-semibold text-foreground">PKR {currentTotal.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Already Paid</span>
            <span className="font-semibold text-emerald-600">PKR {currentPaid.toLocaleString()}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Outstanding</span>
            <span className="text-lg font-bold text-amber-600">PKR {pending.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Payment Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Payment Details</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" />
                      Amount (PKR)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="h-10"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Outstanding balance: PKR {pending.toLocaleString()}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      Payment Date
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5" />
                    Payment Method (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Cash, Bank Transfer, Cheque, Credit Card"
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Payment reference, transaction ID, or any additional notes..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <X className="mr-2 h-4 w-4 shrink-0" />
                <span>Cancel</span>
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Record Payment</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

