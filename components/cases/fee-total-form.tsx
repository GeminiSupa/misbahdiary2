"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateFeeTotal } from "@/app/(app)/cases/[id]/actions";
import { feeTotalSchema, type FeeTotalFormValues } from "@/lib/validation/finances";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  DollarSign,
  CheckCircle2,
  X,
  Info,
} from "lucide-react";

type FeeTotalFormProps = {
  matterId: string;
  currentTotal?: number;
  currentPaid?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function FeeTotalForm({
  matterId,
  currentTotal = 0,
  currentPaid = 0,
  onSuccess,
  onCancel,
}: FeeTotalFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FeeTotalFormValues>({
    resolver: zodResolver(feeTotalSchema),
    defaultValues: {
      matterId,
      feeTotal: currentTotal > 0 ? currentTotal : undefined,
    },
  });

  const onSubmit = async (values: FeeTotalFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("matterId", values.matterId);
    formData.append("feeTotal", values.feeTotal.toString());

    const result = await updateFeeTotal(formData);

    if (result.success) {
      router.refresh();
      onSuccess?.();
      setIsSubmitting(false);
      return;
    }

    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([key, messages]) => {
        const message = messages?.[0];
        if (message) {
          form.setError(key as keyof FeeTotalFormValues, {
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
          <AlertTitle>Unable to update fee total</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {currentPaid > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Payment Already Recorded</AlertTitle>
          <AlertDescription>
            You have already recorded PKR {currentPaid.toLocaleString()} in payments. 
            Make sure the new fee total is at least this amount.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Set Fee Total</h3>
            </div>

            <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
              <div className="grid gap-3 text-sm mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Fee Total</span>
                  <span className="font-semibold text-foreground">PKR {currentTotal.toLocaleString()}</span>
                </div>
                {currentPaid > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Already Paid</span>
                    <span className="font-semibold text-emerald-600">PKR {currentPaid.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="feeTotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5" />
                    New Fee Total (PKR)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={currentPaid}
                      step="0.01"
                      placeholder="0.00"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="h-10"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {currentPaid > 0
                      ? `Minimum: PKR ${currentPaid.toLocaleString()} (already paid)`
                      : "Enter the total fee amount for this matter"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          <div className="flex justify-end gap-3 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-w-0">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  <span className="truncate">Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Update Fee Total</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

