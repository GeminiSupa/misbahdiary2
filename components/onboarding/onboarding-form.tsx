"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { OnboardingPayload } from "@/app/onboarding/actions";
import { completeOnboarding } from "@/app/onboarding/actions";
import { Loader2, Building2, Mail, Phone, User, Briefcase, CheckCircle2 } from "lucide-react";
import { onboardingSchema } from "@/lib/validation/onboarding";

type OnboardingFormProps = {
  defaultValues: Partial<OnboardingPayload>;
};

export function OnboardingForm({ defaultValues }: OnboardingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<OnboardingPayload>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firmName: defaultValues.firmName ?? "",
      contactEmail: defaultValues.contactEmail ?? "",
      contactPhone: defaultValues.contactPhone ?? "",
      fullName: defaultValues.fullName ?? "",
    },
  });

  const handleSubmit = async (values: OnboardingPayload) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await completeOnboarding(values);

    if (result.success) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([key, messages]) => {
        const message = messages?.[0];
        if (message) {
          form.setError(key as keyof OnboardingPayload, {
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
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Welcome to Lawyer Diary
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          Tell us about your practice
        </h1>
        <p className="text-sm text-muted-foreground">
          We use these details to personalize your workspace and enforce
          multi-tenant access controls.
        </p>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertTitle>Unable to finish setup</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Firm Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Building2 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Firm Information</h3>
            </div>

            <FormField
              control={form.control}
              name="firmName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    Firm or Practice Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Khan & Associates"
                      autoComplete="organization"
                      className="h-10"
                    />
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
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      Contact Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="contact@lawfirm.pk"
                        autoComplete="email"
                        className="h-10"
                      />
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
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      Contact Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+92 300 1234567"
                        autoComplete="tel"
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

          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <User className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Your Information</h3>
            </div>

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    Your Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Adv. Ayesha Khan"
                      autoComplete="name"
                      className="h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-foreground">Principal / Partner</p>
                  <p className="text-xs text-muted-foreground">
                    Firm owner or managing partner. New accounts are created with this role; you can add team
                    members with other roles from Settings after setup.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                  <span>Finish Setup</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
