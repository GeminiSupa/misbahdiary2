"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { updateProfileSettings, changePassword } from "@/app/(app)/settings/actions";
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
import { Loader2, User, Phone, Globe, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";
import { profileFormSchema, changePasswordSchema, type ProfileFormSchema } from "@/lib/validation/settings";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { z } from "zod";

type ProfileSettingsFormProps = {
  initialValues: {
    fullName: string;
    phone: string | null;
    languagePreference: "en" | "ur";
  };
};

export function ProfileSettingsForm({ initialValues }: ProfileSettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: initialValues.fullName,
      phone: initialValues.phone ?? "",
      languagePreference: initialValues.languagePreference ?? "en",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ProfileFormSchema) => {
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    const result = await updateProfileSettings({
      fullName: values.fullName,
      phone: values.phone,
      languagePreference: values.languagePreference,
    });

    if (result.success) {
      setFormSuccess("Profile updated successfully!");
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
        variant: "success",
      });
      router.refresh();
      setTimeout(() => setFormSuccess(null), 3000);
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

  const onPasswordSubmit = async (values: z.infer<typeof changePasswordSchema>) => {
    setPasswordError(null);
    setIsChangingPassword(true);

    const result = await changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    });

    if (result.success) {
      passwordForm.reset();
      setFormSuccess("Password changed successfully!");
      toast({
        title: "Password changed",
        description: "Your password has been successfully changed. A confirmation email has been sent.",
        variant: "success",
      });
      router.refresh();
      setTimeout(() => setFormSuccess(null), 3000);
      setIsChangingPassword(false);
      return;
    }

    if (result.fieldErrors) {
      Object.entries(result.fieldErrors).forEach(([key, messages]) => {
        const message = messages?.[0];
        if (message) {
          passwordForm.setError(key as "currentPassword" | "newPassword" | "confirmPassword", {
            type: "server",
            message,
          });
        }
      });
    }

    if (result.message) {
      setPasswordError(result.message);
    }

    setIsChangingPassword(false);
  };

  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4 sm:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Personal Profile</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Update your information and preferences
            </p>
          </div>
        </div>

        {formError && (
          <Alert variant="destructive">
            <AlertTitle>Unable to update profile</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {formSuccess && (
          <Alert className="border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-emerald-700 dark:text-emerald-400">Success</AlertTitle>
            <AlertDescription className="text-emerald-600 dark:text-emerald-300">
              {formSuccess}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Personal Information - Compact SAP Fiori style */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <User className="h-4 w-4 text-primary shrink-0" />
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

            <Separator className="my-4" />

            {/* Language Preference - Compact */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <Globe className="h-4 w-4 text-primary shrink-0" />
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

            {/* SAP Fiori-style action bar - Mobile optimized */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border/60">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setFormError(null);
                  setFormSuccess(null);
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px]"
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>

        <Separator className="my-4 sm:my-6" />

        {/* Password Change Section - Compact */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/40">
            <Lock className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
          </div>

          {passwordError && (
            <Alert variant="destructive">
              <AlertTitle>Unable to change password</AlertTitle>
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}

          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Lock className="h-3.5 w-3.5" />
                          Current Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showCurrentPassword ? "text" : "password"}
                              {...field}
                              className="h-10 pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Lock className="h-3.5 w-3.5" />
                            New Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showNewPassword ? "text" : "password"}
                                {...field}
                                className="h-10 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Must be at least 8 characters with uppercase, lowercase, and number.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Lock className="h-3.5 w-3.5" />
                            Confirm New Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                {...field}
                                className="h-10 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      variant="outline"
                      className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px]"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                          <span>Changing...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4 shrink-0" />
                          <span>Change Password</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
      </div>
    </div>
  );
}
