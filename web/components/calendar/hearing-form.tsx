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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { scheduleValidationSchema } from "@/lib/validation/hearings";

type HearingFormProps = {
  matters: Array<{ id: string; label: string }>;
};

export function HearingForm({ matters }: HearingFormProps) {
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
    <div className="space-y-5">
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to schedule hearing</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="sap-form">
          <FormField
            control={form.control}
            name="matterId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matter</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & time</FormLabel>
                  <FormControl>
                    <Input {...field} type="datetime-local" />
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
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min={5} step={5} />
                  </FormControl>
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
                <FormLabel>Venue / location</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Courtroom, chamber, or virtual link" />
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
                    placeholder="Prep checklist, evidence reminders, counsel notes..."
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
            Schedule hearing
          </Button>
        </form>
      </Form>
    </div>
  );
}

