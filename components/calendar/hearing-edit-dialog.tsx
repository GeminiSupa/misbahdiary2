// @ts-nocheck

"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
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
import { updateHearing, type HearingUpdateValues } from "@/app/(app)/calendar/actions";
import { hearingStatusOptions } from "@/lib/constants/hearings";
import { updateSchema } from "@/lib/validation/hearings";
import { Loader2, PencilLine } from "lucide-react";

type HearingEditDialogProps = {
  hearing: {
    id: string;
    matterId: string;
    scheduledAt: string;
    durationMinutes: number | null;
    location: string | null;
    status: string;
    notes: string | null;
  };
  matters: Array<{ id: string; label: string }>;
};

export function HearingEditDialog({ hearing, matters }: HearingEditDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<HearingUpdateValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      hearingId: hearing.id,
      matterId: hearing.matterId,
      scheduledAt: new Date(hearing.scheduledAt).toISOString().slice(0, 16),
      durationMinutes: hearing.durationMinutes ?? 30,
      location: hearing.location ?? "",
      status: (hearing.status as HearingUpdateValues["status"]) ?? "scheduled",
      notes: hearing.notes ?? "",
    },
  });

  const onSubmit = (values: HearingUpdateValues) => {
    startTransition(async () => {
      await updateHearing(values);
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full sm:w-auto">
          <PencilLine className="mr-2 h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">Reschedule</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update hearing</DialogTitle>
          <DialogDescription>
            Adjust the hearing date, duration, or court. Notifications will be sent automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="sap-form">
            <input type="hidden" {...form.register("hearingId")} value={hearing.id} />
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
                      {matters.map((matter) => (
                        <option key={matter.id} value={matter.id}>
                          {matter.label}
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
                    <FormLabel>Date & time</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" className="text-base sm:text-sm h-10 sm:h-11" />
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
                      <Input {...field} type="number" min={5} step={5} className="text-base sm:text-sm h-10 sm:h-11" />
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
                  <FormLabel>Court</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Court name or location" className="text-base sm:text-sm h-10 sm:h-11" />
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
                  <FormLabel>Nature of Proceedings</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Describe the nature of proceedings, guidance or preparation notes..."
                      className="text-base sm:text-sm resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="ghost" className="w-full sm:w-auto h-11 sm:h-10">
                  <span className="whitespace-nowrap">Cancel</span>
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto h-11 sm:h-10 text-base sm:text-sm">
                {isPending ? <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" /> : null}
                <span className="whitespace-nowrap">{isPending ? "Saving..." : "Save changes"}</span>
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

