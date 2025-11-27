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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

type InvoiceFormProps = {
  clients: Array<{ id: string; label: string }>;
  matters: Array<{ id: string; label: string }>;
  unbilledTimeEntries: Array<{
    id: string;
    label: string;
    amount: number;
  }>;
};

export function InvoiceForm({ clients, matters, unbilledTimeEntries }: InvoiceFormProps) {
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
    <div className="space-y-5">
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to create invoice</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="sap-form">
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="INV-2025-001" />
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
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <FormLabel>Matter (optional)</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <FormLabel>Issue date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
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
                  <FormLabel>Due date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
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
                      className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="subtotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtotal (PKR)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={0} step="0.01" />
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
                  <FormLabel>Tax amount</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={0} step="0.01" />
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
                  <FormLabel>Discount</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={0} step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="sap-subtle flex flex-col gap-2 text-left text-sm text-muted-foreground">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide">
              <span>Unbilled time entries</span>
              <span className="font-semibold text-primary">
                PKR {timeEntryTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs uppercase tracking-wide">
              <span>Base subtotal</span>
              <span className="font-semibold text-primary">
                PKR {subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-foreground">
              <span>Total amount</span>
              <span>PKR {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {unbilledTimeEntries.length > 0 ? (
            <FormField
              control={form.control}
              name="timeEntryIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attach unbilled time entries</FormLabel>
                  <FormControl>
                    <div className="grid gap-2 rounded-2xl border border-border/60 bg-background/60 p-3">
                      {unbilledTimeEntries.map((entry) => {
                        const checked = field.value?.includes(entry.id) ?? false;
                        return (
                          <label
                            key={entry.id}
                            className="flex cursor-pointer items-center justify-between rounded-xl border border-border/50 bg-card/70 px-3 py-2 text-sm transition hover:border-primary/50"
                          >
                            <span>
                              {entry.label}
                              <span className="ml-2 text-xs text-muted-foreground">
                                PKR {entry.amount.toLocaleString()}
                              </span>
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
                            />
                          </label>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}

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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Create invoice
          </Button>
        </form>
      </Form>
    </div>
  );
}

