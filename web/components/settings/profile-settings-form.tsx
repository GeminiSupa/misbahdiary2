// @ts-nocheck

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateProfileSettings } from "@/app/(app)/settings/actions";
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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, User, Phone, Globe, CheckCircle2 } from "lucide-react";
import { profileFormSchema } from "@/lib/validation/settings";
import { cn } from "@/lib/utils";

type ProfileSettingsFormProps = {
  initialValues: {
    fullName: string;
    phone: string | null;
    languagePreference: "en" | "ur";
  };
};

export function ProfileSettingsForm({ initialValues }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: initialValues.fullName,
      phone: initialValues.phone ?? "",
      languagePreference: initialValues.languagePreference ?? "en",
    },
  });

  const onSubmit = async (values: {
    fullName: string;
    phone: string;
    languagePreference: "en" | "ur";
  }) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await updateProfileSettings({
      fullName: values.fullName,
      phone: values.phone,
      languagePreference: values.languagePreference,
    });

    if (result.success) {
      router.refresh();
      setIsSubmitting(false);
      return;
    }

    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([key, messages]) => {
        const message = messages?.[0];
        if (message) {
          form.setError(key as "fullName" | "phone" | "languagePreference", {
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
      <div className="sap-card-body space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Profile Settings</h2>
          <p className="text-sm text-muted-foreground">
            Update your contact details and choose your preferred language (English / Urdu).
          </p>
        </div>

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Unable to update profile</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
              </div>

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input {...field} className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+92 300 1234567" className="h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Language Preference</h3>
              </div>

              <FormField
                control={form.control}
                name="languagePreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Language</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        {[
                          { value: "en", label: "English" },
                          { value: "ur", label: "اردو" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              "flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all",
                              "hover:scale-[1.02] active:scale-[0.98]",
                              field.value === option.value
                                ? "border-primary bg-primary text-primary-foreground shadow-md"
                                : "border-border bg-background hover:border-primary/50",
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Choose your preferred language for the interface
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save Changes
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
