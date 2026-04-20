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

  const toggleTrackClass =
    "w-11 h-6 rounded-full border border-border bg-muted transition-colors peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 peer-focus:ring-offset-2 peer-focus:ring-offset-background peer-checked:bg-primary peer-checked:border-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border after:border-border after:rounded-full after:h-5 after:w-5 after:transition-transform after:shadow-sm peer-checked:after:translate-x-5";

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">Notification preferences</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Choose which alerts you receive.
          </p>
        </div>

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Unable to save changes</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {formSuccess && (
          <Alert className="border-primary/40 bg-primary/5">
            <AlertTitle>Preferences updated</AlertTitle>
            <AlertDescription>{formSuccess}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 py-2">
                <Bell className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-medium text-foreground">Notification types</h3>
              </div>

              <FormField
                control={form.control}
                name="hearingReminders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 p-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="rounded-md bg-primary/10 p-2 shrink-0 mt-0.5">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <FormLabel className="text-sm font-medium text-foreground cursor-pointer">
                          Hearing reminders
                        </FormLabel>
                        <FormDescription className="text-xs mt-0.5 text-muted-foreground">
                          Notified 24 hours before scheduled hearings or chamber meetings.
                        </FormDescription>
                      </div>
                    </div>
                    <FormControl>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        <div className={toggleTrackClass} />
                      </label>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceReminders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 p-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="rounded-md bg-primary/10 p-2 shrink-0 mt-0.5">
                        <Receipt className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <FormLabel className="text-sm font-medium text-foreground cursor-pointer">
                          Invoice reminders
                        </FormLabel>
                        <FormDescription className="text-xs mt-0.5 text-muted-foreground">
                          Alerts when invoices are issued, paid, or due within 24 hours.
                        </FormDescription>
                      </div>
                    </div>
                    <FormControl>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        <div className={toggleTrackClass} />
                      </label>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="announcementUpdates"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 p-4 hover:border-border/80 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="rounded-md bg-primary/10 p-2 shrink-0 mt-0.5">
                        <Megaphone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <FormLabel className="text-sm font-medium text-foreground cursor-pointer">
                          Product updates
                        </FormLabel>
                        <FormDescription className="text-xs mt-0.5 text-muted-foreground">
                          New modules, integrations, and roadmap announcements.
                        </FormDescription>
                      </div>
                    </div>
                    <FormControl>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                        />
                        <div className={toggleTrackClass} />
                      </label>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px] touch-manipulation"
              >
                <span>Reset</span>
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px] touch-manipulation"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                    Save preferences
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
