// @ts-nocheck

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { createInvoice, type InvoiceFormValues } from "@/app/(app)/billing/actions";
import { invoiceStatusOptions } from "@/lib/constants/invoices";
import { invoiceFormSchema } from "@/lib/validation/invoices";
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
import { Loader2, Receipt, User, Briefcase, Calendar, DollarSign, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type InvoiceFormProps = {
  clients: Array<{ id: string; label: string }>;
  matters: Array<{ id: string; label: string }>;
  unbilledTimeEntries: Array<{
    id: string;
    label: string;
    amount: number;
  }>;
  onSuccess?: () => void;
};

export function InvoiceForm({ clients, matters, unbilledTimeEntries, onSuccess }: InvoiceFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: "",
      clientId: "",
      matterId: "",
      status: "draft",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      notes: "",
      timeEntryIds: [],
    },
  });

  const [watchedSubtotal = 0, watchedTax = 0, watchedDiscount = 0] = useWatch({
    control: form.control,
    name: ["subtotal", "taxAmount", "discountAmount"],
  });
  const watchedTimeEntryIds = useWatch({
    control: form.control,
    name: "timeEntryIds",
  }) ?? [];

  const timeEntryAmountMap = new Map(
    unbilledTimeEntries.map((entry) => [entry.id, entry.amount]),
  );

  const timeEntryTotal = watchedTimeEntryIds.reduce((sum, entryId) => {
    const amount = timeEntryAmountMap.get(entryId) ?? 0;
    return sum + Number(amount);
  }, 0);

  const subtotal = Number(watchedSubtotal ?? 0);
  const tax = Number(watchedTax ?? 0);
  const discount = Number(watchedDiscount ?? 0);
  const combinedSubtotal = subtotal + timeEntryTotal;
  const totalAmount = Math.max(combinedSubtotal + tax - discount, 0);

  const onSubmit = async (values: InvoiceFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await createInvoice(values);

    if (result.success) {
      form.reset({
        invoiceNumber: "",
        clientId: "",
        matterId: "",
        status: "draft",
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: "",
        subtotal: 0,
        taxAmount: 0,
        discountAmount: 0,
        notes: "",
        timeEntryIds: [],
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
          form.setError(key as keyof InvoiceFormValues, {
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
          <AlertTitle>Unable to create invoice</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Receipt className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Invoice Information</h3>
            </div>

            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Receipt className="h-3.5 w-3.5" />
                    Invoice Number
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="INV-2025-001" className="h-10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      Client
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        <option value="">Select client</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="matterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5" />
                      Matter (Optional)
                    </FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        <option value="">Unassigned</option>
                        {matters.map((matter) => (
                          <option key={matter.id} value={matter.id}>
                            {matter.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      Issue Date
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      Due Date
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className={cn(
                          "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                      >
                        {invoiceStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Financial Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Financial Details</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="subtotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtotal (PKR)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        step="0.01"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Amount (PKR)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        step="0.01"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discountAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount (PKR)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        step="0.01"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Summary Card */}
            <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Unbilled Time Entries
                </span>
                <span className="font-semibold text-primary">
                  PKR {timeEntryTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Base Subtotal</span>
                <span className="font-semibold text-primary">
                  PKR {subtotal.toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-base font-bold text-foreground">
                <span>Total Amount</span>
                <span className="text-lg">PKR {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {unbilledTimeEntries.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                  <Clock className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Time Entries</h3>
                </div>
                <FormField
                  control={form.control}
                  name="timeEntryIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attach Unbilled Time Entries</FormLabel>
                      <FormControl>
                        <div className="grid gap-2 max-h-48 overflow-y-auto p-3 border rounded-lg bg-muted/30">
                          {unbilledTimeEntries.map((entry) => {
                            const checked = field.value?.includes(entry.id) ?? false;
                            return (
                              <label
                                key={entry.id}
                                className={cn(
                                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg border-2 px-4 py-3 text-sm transition-all",
                                  "hover:scale-[1.01] active:scale-[0.99]",
                                  checked
                                    ? "border-primary bg-primary/10 text-primary font-medium"
                                    : "border-border bg-background hover:border-primary/50",
                                )}
                              >
                                <span className="flex-1">{entry.label}</span>
                                <span className="text-xs font-semibold">
                                  PKR {entry.amount.toLocaleString()}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) => {
                                    const selected = field.value ?? [];
                                    if (event.target.checked) {
                                      field.onChange([...selected, entry.id]);
                                    } else {
                                      field.onChange(selected.filter((id) => id !== entry.id));
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Select time entries to include in this invoice
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}

          <Separator />

          {/* Notes */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Payment instructions, retainer adjustments, or case references..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSubmitting}
              className="w-full sm:w-auto min-w-0"
            >
              <span className="truncate">Reset</span>
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-w-0">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  <span className="truncate">Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">Create Invoice</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
