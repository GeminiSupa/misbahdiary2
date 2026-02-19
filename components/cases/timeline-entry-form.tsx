"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addCaseHistoryEntry } from "@/app/(app)/cases/[id]/actions";
import { caseHistorySchema, type CaseHistoryFormValues } from "@/lib/validation/case-histories";
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
  Calendar,
  FileText,
  MapPin,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TimelineEntryFormProps = {
  matterId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function TimelineEntryForm({ matterId, onSuccess, onCancel }: TimelineEntryFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CaseHistoryFormValues>({
    resolver: zodResolver(caseHistorySchema),
    defaultValues: {
      matterId,
      date: new Date().toISOString().slice(0, 10),
      details: "",
      stage: "",
      courtName: "",
      hearingDate: "",
      caseNumber: "",
      nextHearingReason: "",
    },
  });

  const onSubmit = async (values: CaseHistoryFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("matterId", values.matterId);
    formData.append("date", values.date);
    formData.append("details", values.details);
    if (values.stage) formData.append("stage", values.stage);
    if (values.courtName) formData.append("courtName", values.courtName);
    if (values.hearingDate) formData.append("hearingDate", values.hearingDate);
    if (values.caseNumber) formData.append("caseNumber", values.caseNumber);
    if (values.nextHearingReason) formData.append("nextHearingReason", values.nextHearingReason);

    const result = await addCaseHistoryEntry(formData);

    if (result.success) {
      form.reset({
        matterId,
        date: new Date().toISOString().slice(0, 10),
        details: "",
        stage: "",
        courtName: "",
        hearingDate: "",
        caseNumber: "",
        nextHearingReason: "",
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
          form.setError(key as keyof CaseHistoryFormValues, {
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
          <AlertTitle>Unable to add timeline entry</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Entry Details</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      Entry Date
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Intake, Filing, Hearing"
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    Details
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Describe what happened, what was filed, or any important updates..."
                      className="resize-none"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Provide a clear description of the timeline entry
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Court & Hearing Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Court & Hearing Information</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="courtName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      Court Name (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Islamabad High Court" className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="caseNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Case Number (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 23/25" className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="hearingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Next Hearing Date (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextHearingReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hearing Reason (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Arguments, Evidence, Judgment"
                        className="h-10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  <span className="whitespace-nowrap">Adding...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">Add Entry</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

