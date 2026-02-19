"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFirmWithOwner } from "@/app/(app)/admin/actions";
import { createFirmSchema, type CreateFirmSchema } from "@/lib/validation/admin";
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
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, User, CheckCircle2, AlertCircle } from "lucide-react";

export function FirmForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<CreateFirmSchema>({
    resolver: zodResolver(createFirmSchema),
    defaultValues: {
      firmName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      ownerEmail: "",
      ownerPassword: "",
      ownerFullName: "",
    },
  });

  const onSubmit = async (values: CreateFirmSchema) => {
    setIsSubmitting(true);
    setFormError(null);
    setSuccess(false);

    try {
      const result = await createFirmWithOwner(values);

      if (result.success) {
        setSuccess(true);
        form.reset();
        setTimeout(() => {
          router.refresh();
        }, 2000);
      } else {
        setFormError(result.message || "Failed to create firm");
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            form.setError(field as keyof CreateFirmSchema, {
              message: errors?.[0],
            });
          });
        }
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Alert className="border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-emerald-800 dark:text-emerald-200">
          Firm and firm owner created successfully! The firm owner can now sign in with the provided credentials.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {/* Firm Information Section */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Firm Information</h3>
              <p className="text-sm text-muted-foreground">Enter the firm&apos;s basic details</p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="firmName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firm Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Law Firm Name" {...field} />
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
                  <FormLabel>Contact Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="firm@example.com" {...field} />
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
                  <FormLabel>Contact Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+92 300 1234567" {...field} />
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
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Firm address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Firm Owner Information Section */}
        <div className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Firm Owner Account</h3>
              <p className="text-sm text-muted-foreground">Create the firm owner&apos;s user account</p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="ownerFullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ownerEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="owner@firm.com" {...field} />
                </FormControl>
                <FormDescription>
                  This will be the firm owner&apos;s login email. Must be unique.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ownerPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password *</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormDescription>
                  Minimum 8 characters, must include uppercase, lowercase, and number.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                <span className="whitespace-nowrap">Creating...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Create Firm</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
