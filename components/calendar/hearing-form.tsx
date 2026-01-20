"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { scheduleHearing, type HearingFormValues } from "@/app/(app)/calendar/actions";
import { hearingStatusOptions } from "@/lib/constants/hearings";
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
import { Loader2, Calendar, Clock, MapPin, FileText, CheckCircle2, Briefcase } from "lucide-react";
import { scheduleValidationSchema } from "@/lib/validation/hearings";
import { cn } from "@/lib/utils";

type HearingFormProps = {
  matters: Array<{ id: string; label: string }>;
  onSuccess?: () => void;
};

export function HearingForm({ matters, onSuccess }: HearingFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<HearingFormValues>({
    resolver: zodResolver(scheduleValidationSchema),
    defaultValues: {
      matterId: "",
      scheduledAt: "",
      durationMinutes: 30,
      location: "",
      status: "scheduled",
      notes: "",
    },
  });

  const onSubmit = async (values: HearingFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await scheduleHearing({
      ...values,
      scheduledAt: values.scheduledAt,
    });

    if (result.success) {
      form.reset({
        matterId: "",
        scheduledAt: "",
        durationMinutes: 30,
        location: "",
        status: "scheduled",
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
          form.setError(key as keyof HearingFormValues, {
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
          <AlertTitle>Unable to schedule hearing</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Hearing Details</h3>
            </div>

            <FormField
              control={form.control}
              name="matterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5" />
                    Matter
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
                      <option value="">Select matter</option>
                      {matters.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      Date & Time
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" className="h-10 sm:h-11 text-base sm:text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Duration (minutes)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={5}
                        step={5}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-10 sm:h-11 text-base sm:text-sm"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Minimum 5 minutes, increments of 5</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    Court
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Court name or location"
                      className="h-10 sm:h-11 text-base sm:text-sm"
                    />
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
                      {hearingStatusOptions.map((option) => (
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

          <Separator />

          {/* Notes */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Nature of Proceedings</h3>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nature of Proceedings</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Describe the nature of proceedings, prep checklist, evidence reminders..."
                      className="resize-none text-base sm:text-sm"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Describe the type of hearing and any important preparation notes
                  </FormDescription>
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
              className="w-full sm:w-auto h-11 sm:h-10"
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-w-[140px] h-11 sm:h-10 text-base sm:text-sm">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Scheduling...</span>
                  <span className="sm:hidden">Scheduling</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Schedule Hearing</span>
                  <span className="sm:hidden">Schedule</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
