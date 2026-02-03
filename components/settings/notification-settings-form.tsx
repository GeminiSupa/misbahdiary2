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
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Bell, Calendar, Receipt, Megaphone, CheckCircle2 } from "lucide-react";
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
      setFormSuccess("Notification preferences updated successfully.");
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
      <div className="sap-card-body space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Notification Preferences</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Choose which alerts you receive
          </p>
        </div>

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Unable to save changes</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {formSuccess && (
          <Alert>
            <AlertTitle>Preferences updated</AlertTitle>
            <AlertDescription>{formSuccess}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Bell className="h-4 w-4 text-primary flex-shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Notification Types</h3>
              </div>

              <FormField
                control={form.control}
                name="hearingReminders"
                render={({ field }) => (
                  <FormItem className="flex items-start justify-between gap-4 rounded-xl border-2 border-border/60 bg-gradient-to-br from-background/60 to-background/40 p-4 transition-all hover:border-primary/50 hover:shadow-md">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                          Hearing Reminders
                        </FormLabel>
                        <FormDescription className="text-xs mt-1">
                          Get notified 24 hours before scheduled hearings or chamber meetings.
                        </FormDescription>
                      </div>
                    </div>
                    <FormControl>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceReminders"
                render={({ field }) => (
                  <FormItem className="flex items-start justify-between gap-4 rounded-xl border-2 border-border/60 bg-gradient-to-br from-background/60 to-background/40 p-4 transition-all hover:border-primary/50 hover:shadow-md">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                        <Receipt className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                          Invoice Reminders
                        </FormLabel>
                        <FormDescription className="text-xs mt-1">
                          Alerts when invoices are issued, paid, or due within 24 hours.
                        </FormDescription>
                      </div>
                    </div>
                    <FormControl>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="announcementUpdates"
                render={({ field }) => (
                  <FormItem className="flex items-start justify-between gap-4 rounded-xl border-2 border-border/60 bg-gradient-to-br from-background/60 to-background/40 p-4 transition-all hover:border-primary/50 hover:shadow-md">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                        <Megaphone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <FormLabel className="text-sm font-semibold text-foreground flex items-center gap-2">
                          Product Updates
                        </FormLabel>
                        <FormDescription className="text-xs mt-1">
                          Stay informed about new modules, integrations, and roadmap announcements.
                        </FormDescription>
                      </div>
                    </div>
                    <FormControl>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* SAP Fiori-style action bar */}
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
                    <span className="truncate">Save Preferences</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px]"
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
