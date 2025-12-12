// @ts-nocheck

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
import { Loader2, ShieldQuestion } from "lucide-react";
import { firmFormSchema } from "@/lib/validation/settings";

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

  const onSubmit = async (values: {
    name: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
  }) => {
    if (!canEdit) return;
    setFormError(null);
    setIsSubmitting(true);

    const result = await updateFirmSettings({
      name: values.name,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      address: values.address,
    });

    if (result.success) {
      router.refresh();
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
      <div className="sap-card-body space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Firm profile</h2>
            <p className="text-sm text-muted-foreground">
              Share accurate firm information across invoices, case exports, and client portals.
            </p>
          </div>
          {!canEdit ? (
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
              <ShieldQuestion className="h-3.5 w-3.5" />
              Owner only
            </div>
          ) : null}
        </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to update firm</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="sap-form">
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

          {canEdit ? (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save firm details
            </Button>
          ) : null}
        </form>
      </Form>
    </div>
  </div>
  );
}

