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
import type { OnboardingPayload } from "@/app/onboarding/actions";
import { completeOnboarding } from "@/app/onboarding/actions";
import { Loader2 } from "lucide-react";
import { onboardingSchema, roleOptions } from "@/lib/validation/onboarding";
import { cn } from "@/lib/utils";

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
      role: defaultValues.role ?? "principal_partner",
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
      <div className="space-y-2 text-center">
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

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to finish setup</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="sap-form"
        >
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="firmName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firm or practice name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Khan & Associates"
                      autoComplete="organization"
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
                    <FormLabel>Contact email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="contact@lawfirm.pk"
                        autoComplete="email"
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
                    <FormLabel>Contact number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+92 300 1234567"
                        autoComplete="tel"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your full name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Adv. Ayesha Khan"
                      autoComplete="name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your role</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      {roleOptions.map((option) => (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            "rounded-xl border border-border/60 bg-background/70 p-3 text-left text-sm transition",
                            field.value === option.value
                              ? "border-primary bg-primary/10 text-primary"
                              : "hover:border-primary/50",
                          )}
                        >
                          <span className="font-medium text-foreground">
                            {option.label}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Finish setup
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

