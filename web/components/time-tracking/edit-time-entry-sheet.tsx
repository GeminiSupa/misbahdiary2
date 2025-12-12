"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { updateTimeEntry } from "@/app/(app)/time-tracking/actions";
import { Edit, Loader2, Clock, FileText, DollarSign } from "lucide-react";

const formSchema = z.object({
  id: z.string().uuid(),
  description: z.string().optional().nullable(),
  duration_minutes: z.number().int().min(0),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime().optional().nullable(),
  billable: z.boolean(),
  billing_rate: z.number().min(0).optional().nullable(),
});

type TimeEntry = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  description: string | null;
  billable: boolean;
  billing_rate: number | null;
};

type EditTimeEntrySheetProps = {
  entry: TimeEntry;
  trigger?: React.ReactNode;
};

export function EditTimeEntrySheet({ entry, trigger }: EditTimeEntrySheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: entry.id,
      description: entry.description || "",
      duration_minutes: entry.duration_minutes ?? 0,
      started_at: entry.started_at
        ? new Date(entry.started_at).toISOString().slice(0, 16)
        : "",
      ended_at: entry.ended_at
        ? new Date(entry.ended_at).toISOString().slice(0, 16)
        : null,
      billable: entry.billable ?? true,
      billing_rate: entry.billing_rate ? Number(entry.billing_rate) : null,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("id", values.id);
      if (values.description) formData.append("description", values.description);
      formData.append("duration_minutes", values.duration_minutes.toString());
      formData.append("started_at", new Date(values.started_at).toISOString());
      if (values.ended_at) {
        formData.append("ended_at", new Date(values.ended_at).toISOString());
      } else {
        formData.append("ended_at", "");
      }
      formData.append("billable", values.billable.toString());
      if (values.billing_rate) {
        formData.append("billing_rate", values.billing_rate.toString());
      }

      const result = await updateTimeEntry(formData);

      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.message || "Failed to update time entry");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const durationHours = Math.floor((form.watch("duration_minutes") || 0) / 60);
  const durationMins = (form.watch("duration_minutes") || 0) % 60;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="min-h-[44px] sm:min-h-[40px]">
            <Edit className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Edit</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Time Entry
          </SheetTitle>
          <SheetDescription>Update the details of this time entry.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-6">
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="What did you work on?"
                      className="min-h-[88px] sm:min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="started_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Start Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        className="min-h-[44px] sm:min-h-[40px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ended_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        value={field.value || ""}
                        className="min-h-[44px] sm:min-h-[40px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="min-h-[44px] sm:min-h-[40px]"
                    />
                  </FormControl>
                  <FormDescription>
                    {durationHours > 0 && `${durationHours}h `}
                    {durationMins > 0 && `${durationMins}m`}
                    {durationHours === 0 && durationMins === 0 && "0m"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="billable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Billable</FormLabel>
                      <FormDescription>Mark this time as billable to the client</FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billing_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5" />
                      Billing Rate (PKR/hour)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                        className="min-h-[44px] sm:min-h-[40px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px]"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Entry"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

