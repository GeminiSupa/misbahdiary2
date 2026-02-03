// @ts-nocheck

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateBillingSettings } from "@/app/(app)/settings/actions";
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
  CreditCard,
  Receipt,
  Percent,
  Building2,
  CheckCircle2,
  ShieldQuestion,
} from "lucide-react";
import { billingSettingsSchema, type BillingSettingsSchema } from "@/lib/validation/settings";
import { useToast } from "@/hooks/use-toast";

type BillingSettingsFormProps = {
  initialValues?: {
    invoicePrefix: string;
    invoiceNumberFormat: "YYYY-####" | "####" | "INV-YYYY-####" | "INV-####";
    nextInvoiceNumber: number;
    defaultPaymentTermsDays: number;
    defaultCurrency: string;
    salesTaxRate: number;
    salesTaxLabel: string;
    taxRegistrationNumber: string | null;
    salesTaxRegistrationNumber: string | null;
    paymentMethods: string[];
    bankName: string | null;
    accountTitle: string | null;
    accountNumber: string | null;
    iban: string | null;
    swiftCode: string | null;
    branchCode: string | null;
    branchAddress: string | null;
    invoiceFooter: string | null;
    invoiceNotes: string | null;
    autoGenerateInvoiceNumber: boolean;
  };
  canEdit: boolean;
};

const PAYMENT_METHOD_OPTIONS = [
  "Bank Transfer",
  "Cash",
  "Cheque",
  "Online Payment",
  "Credit Card",
  "Debit Card",
  "Mobile Banking",
];

export function BillingSettingsForm({ initialValues, canEdit }: BillingSettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Safe defaults in case initialValues is undefined
  const safeInitialValues = initialValues || {
    invoicePrefix: "INV",
    invoiceNumberFormat: "YYYY-####" as const,
    nextInvoiceNumber: 1,
    defaultPaymentTermsDays: 30,
    defaultCurrency: "PKR",
    salesTaxRate: 18.0,
    salesTaxLabel: "GST",
    taxRegistrationNumber: null,
    salesTaxRegistrationNumber: null,
    paymentMethods: ["Bank Transfer", "Cash", "Cheque"],
    bankName: null,
    accountTitle: null,
    accountNumber: null,
    iban: null,
    swiftCode: null,
    branchCode: null,
    branchAddress: null,
    invoiceFooter: null,
    invoiceNotes: "Payment should be made within the specified due date.",
    autoGenerateInvoiceNumber: true,
  };

  const form = useForm<BillingSettingsSchema>({
    resolver: zodResolver(billingSettingsSchema),
    defaultValues: {
      invoicePrefix: safeInitialValues.invoicePrefix || "INV",
      invoiceNumberFormat: safeInitialValues.invoiceNumberFormat || "YYYY-####",
      nextInvoiceNumber: safeInitialValues.nextInvoiceNumber || 1,
      defaultPaymentTermsDays: safeInitialValues.defaultPaymentTermsDays || 30,
      defaultCurrency: safeInitialValues.defaultCurrency || "PKR",
      salesTaxRate: safeInitialValues.salesTaxRate || 18.0,
      salesTaxLabel: safeInitialValues.salesTaxLabel || "GST",
      taxRegistrationNumber: safeInitialValues.taxRegistrationNumber || "",
      salesTaxRegistrationNumber: safeInitialValues.salesTaxRegistrationNumber || "",
      paymentMethods: safeInitialValues.paymentMethods || ["Bank Transfer", "Cash", "Cheque"],
      bankName: safeInitialValues.bankName || "",
      accountTitle: safeInitialValues.accountTitle || "",
      accountNumber: safeInitialValues.accountNumber || "",
      iban: safeInitialValues.iban || "",
      swiftCode: safeInitialValues.swiftCode || "",
      branchCode: safeInitialValues.branchCode || "",
      branchAddress: safeInitialValues.branchAddress || "",
      invoiceFooter: safeInitialValues.invoiceFooter || "",
      invoiceNotes: safeInitialValues.invoiceNotes || "Payment should be made within the specified due date.",
      autoGenerateInvoiceNumber: safeInitialValues.autoGenerateInvoiceNumber ?? true,
    },
  });

  const onSubmit = async (values: BillingSettingsSchema) => {
    if (!canEdit) return;
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    const result = await updateBillingSettings(values);

    if (result.success) {
      setFormSuccess("Billing settings updated successfully!");
      toast({
        title: "Settings updated",
        description: "Your billing settings have been successfully updated.",
        variant: "success",
      });
      router.refresh();
      setTimeout(() => setFormSuccess(null), 3000);
      setIsSubmitting(false);
      return;
    }

    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([key, messages]) => {
        const message = messages?.[0];
        if (message) {
          form.setError(key as keyof BillingSettingsSchema, {
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
    <div className="sap-card">
      <div className="sap-card-body space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Billing Settings</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Configure invoice defaults and billing preferences for Pakistan.
            </p>
          </div>
          {!canEdit && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1.5 text-[10px] sm:text-xs font-medium text-amber-700 dark:text-amber-400 shrink-0">
              <ShieldQuestion className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Owner/Partner only</span>
              <span className="sm:hidden">Owner</span>
            </div>
          )}
        </div>

        {formSuccess && (
          <Alert className="border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-emerald-700 dark:text-emerald-400">Success</AlertTitle>
            <AlertDescription className="text-emerald-600 dark:text-emerald-300">
              {formSuccess}
            </AlertDescription>
          </Alert>
        )}

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Unable to update billing settings</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Invoice Numbering */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Receipt className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Invoice Numbering</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="invoicePrefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Prefix</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} placeholder="INV" className="h-10" />
                      </FormControl>
                      <FormDescription className="text-xs">Prefix for invoice numbers (e.g., INV)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="invoiceNumberFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number Format</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled={!canEdit}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="YYYY-####">YYYY-#### (2025-0001)</option>
                          <option value="####">#### (0001)</option>
                          <option value="INV-YYYY-####">INV-YYYY-#### (INV-2025-0001)</option>
                          <option value="INV-####">INV-#### (INV-0001)</option>
                        </select>
                      </FormControl>
                      <FormDescription className="text-xs">Format for invoice numbers</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextInvoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Invoice Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          disabled={!canEdit}
                          className="h-10"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Starting number for new invoices</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="autoGenerateInvoiceNumber"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto-generate Invoice Numbers</FormLabel>
                      <FormDescription className="text-xs">
                        Automatically generate invoice numbers when creating new invoices
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        disabled={!canEdit}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            {/* Payment Terms */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <CreditCard className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Payment Terms</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="defaultPaymentTermsDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Payment Terms (Days)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          disabled={!canEdit}
                          className="h-10"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">Default number of days for payment (e.g., 30 for Net 30)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Currency</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} className="h-10" />
                      </FormControl>
                      <FormDescription className="text-xs">Default currency for invoices (PKR)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Tax Settings - Pakistan Specific */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Percent className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Tax Settings (Pakistan)</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="salesTaxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales Tax Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          disabled={!canEdit}
                          className="h-10"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">GST rate (typically 18% in Pakistan)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salesTaxLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Label</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} placeholder="GST" className="h-10" />
                      </FormControl>
                      <FormDescription className="text-xs">Label for tax on invoices (e.g., GST, Sales Tax)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="taxRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NTN (National Tax Number)</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} placeholder="1234567-8" className="h-10" />
                      </FormControl>
                      <FormDescription className="text-xs">Your firm's National Tax Number</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salesTaxRegistrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>STRN (Sales Tax Registration Number)</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} placeholder="1234567890123" className="h-10" />
                      </FormControl>
                      <FormDescription className="text-xs">Your firm's Sales Tax Registration Number</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Payment Methods */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <CreditCard className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Payment Methods</h3>
              </div>

              <FormField
                control={form.control}
                name="paymentMethods"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {PAYMENT_METHOD_OPTIONS.map((method) => (
                        <FormField
                          key={method}
                          control={form.control}
                          name="paymentMethods"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={method}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/60 p-3"
                              >
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value?.includes(method)}
                                    disabled={!canEdit}
                                    onChange={(e) => {
                                      const current = field.value || [];
                                      if (e.target.checked) {
                                        field.onChange([...current, method]);
                                      } else {
                                        field.onChange(current.filter((v) => v !== method));
                                      }
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 mt-0.5"
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer">{method}</FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormDescription className="text-xs">Select payment methods available for your clients</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            {/* Bank Account Details */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Bank Account Details</h3>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} placeholder="Bank Name" className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Title</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} placeholder="Account Holder Name" className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} placeholder="Account Number" className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IBAN</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} placeholder="PK00XXXX0000000000000000" className="h-10" />
                      </FormControl>
                      <FormDescription className="text-xs">International Bank Account Number</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="swiftCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SWIFT Code</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} placeholder="SWIFT Code" className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Code</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canEdit} placeholder="Branch Code" className="h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="branchAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={!canEdit} rows={2} placeholder="Branch Address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            {/* Invoice Template */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Receipt className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Invoice Template</h3>
              </div>

              <FormField
                control={form.control}
                name="invoiceNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Invoice Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!canEdit}
                        rows={3}
                        placeholder="Payment should be made within the specified due date."
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Default notes to appear on invoices</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceFooter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Footer</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={!canEdit}
                        rows={2}
                        placeholder="Thank you for your business!"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Footer text to appear at the bottom of invoices</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            {canEdit && (
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border/60">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-w-0 min-h-[44px] sm:min-h-[40px]">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                      <span className="truncate">Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">Save Changes</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setFormError(null);
                    setFormSuccess(null);
                  }}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px]"
                >
                  Reset
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
