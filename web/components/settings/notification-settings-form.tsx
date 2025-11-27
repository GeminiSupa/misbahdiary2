"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateNotificationPreferences } from "@/app/(app)/settings/actions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { notificationPreferencesSchema } from "@/lib/validation/settings";
import type { NotificationPreferencesSchema } from "@/lib/validation/settings";

type NotificationSettingsFormProps = {
  initialValues: {
    hearingReminders: boolean;
    invoiceReminders: boolean;
    announcementUpdates: boolean;
  };
};

export function NotificationSettingsForm({ initialValues }: NotificationSettingsFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NotificationPreferencesSchema>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: initialValues,
  });

  const onSubmit = async (values: NotificationPreferencesSchema) => {
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    const result = await updateNotificationPreferences(values);

    if (result.success) {
      setFormSuccess("Notification preferences updated.");
      setIsSubmitting(false);
      return;
    }

    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([key, messages]) => {
        const message = messages?.[0];
        if (message) {
          form.setError(key as keyof NotificationPreferencesSchema, {
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
        <div>
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Choose the alerts you receive inside Lawyer Diary. Email/SMS options will arrive soon.
          </p>
        </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to save changes</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {formSuccess ? (
        <Alert>
          <AlertTitle>Preferences updated</AlertTitle>
          <AlertDescription>{formSuccess}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="sap-form">
          <FormField
            control={form.control}
            name="hearingReminders"
            render={({ field }) => (
              <FormItem className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-background/60 p-4">
                <div>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Hearing reminders
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Get notified 24 hours before scheduled hearings or chamber meetings.
                  </p>
                </div>
                <FormControl>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceReminders"
            render={({ field }) => (
              <FormItem className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-background/60 p-4">
                <div>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Invoice reminders
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Alerts when invoices are issued, paid, or due within 24 hours.
                  </p>
                </div>
                <FormControl>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="announcementUpdates"
            render={({ field }) => (
              <FormItem className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-background/60 p-4">
                <div>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Product updates
                  </FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Stay informed about new modules, integrations, and roadmap announcements.
                  </p>
                </div>
                <FormControl>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save preferences"}
          </Button>
        </form>
      </Form>
    </div>
  </div>
  );
}

