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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { profileFormSchema } from "@/lib/validation/settings";

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
      <div className="sap-card-body space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Profile settings</h2>
          <p className="text-sm text-muted-foreground">
            Update your contact details and choose your preferred language (English / Urdu).
          </p>
        </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to update profile</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="sap-form">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+92 300 1234567" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="languagePreference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
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
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                          field.value === option.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </form>
      </Form>
    </div>
  </div>
  );
}

