"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateFirmSettings } from "@/app/(app)/settings/actions";
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
import { Loader2, ShieldQuestion, CheckCircle2 } from "lucide-react";
import { firmFormSchema, type FirmFormSchema } from "@/lib/validation/settings";

type FirmSettingsCardProps = {
  initialValues: {
    name: string;
    contactEmail: string | null;
    contactPhone: string | null;
    address: string | null;
  };
  canEdit: boolean;
};

export function FirmSettingsCard({ initialValues, canEdit }: FirmSettingsCardProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(firmFormSchema),
    defaultValues: {
      name: initialValues.name,
      contactEmail: initialValues.contactEmail ?? "",
      contactPhone: initialValues.contactPhone ?? "",
      address: initialValues.address ?? "",
    },
  });

  const onSubmit = async (values: FirmFormSchema) => {
    if (!canEdit) return;
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    const result = await updateFirmSettings({
      name: values.name,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      address: values.address,
    });

    if (result.success) {
      setFormSuccess("Firm information updated successfully!");
      router.refresh();
      setTimeout(() => setFormSuccess(null), 3000);
      setIsSubmitting(false);
      return;
    }

    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([key, messages]) => {
        const message = messages?.[0];
        if (message) {
          form.setError(key as "name" | "contactEmail" | "contactPhone" | "address", {
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
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Firm Information</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Firm details appear on invoices and communications
            </p>
          </div>
          {!canEdit && (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1.5 text-[10px] sm:text-xs font-medium text-amber-700 dark:text-amber-400 shrink-0">
              <ShieldQuestion className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Owner only</span>
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

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to update firm</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firm name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!canEdit} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={!canEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact phone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+92 21 1234567" disabled={!canEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Office address</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder="Office #10, State Life Building, Karachi"
                    disabled={!canEdit}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {canEdit && (
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border/60">
              <Button type="submit" disabled={isSubmitting} className="min-w-[140px] w-full sm:w-auto min-h-[44px] sm:min-h-[40px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save Changes
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

