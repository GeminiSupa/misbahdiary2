"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useSupabase } from "@/components/providers/supabase-provider";
import { Loader2 } from "lucide-react";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const magicLinkSchema = z.object({
  email: z.string().email(),
});

type CredentialsFormValues = z.infer<typeof credentialsSchema>;
type MagicLinkFormValues = z.infer<typeof magicLinkSchema>;

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { supabase } = useSupabase();
  const [error, setError] = useState<string | null>(() => params.get("error"));
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CredentialsFormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: params.get("email") ?? "",
      password: "",
    },
  });

  const magicForm = useForm<MagicLinkFormValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: params.get("email") ?? "",
    },
  });

  const handlePasswordSignIn = async (values: CredentialsFormValues) => {
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });

      if (signInError) {
        setError(signInError.message || "Failed to sign in. Please check your credentials.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to the server. Please check your internet connection and try again.";
      setError(errorMessage);
      console.error("Sign in error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async (values: MagicLinkFormValues) => {
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: values.email.trim(),
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_SITE_URL?.concat("/auth/callback") ??
            "http://localhost:3000/auth/callback",
        },
      });

      if (magicError) {
        setError(magicError.message || "Failed to send magic link. Please try again.");
        return;
      }

      setInfo("Check your inbox for a magic login link.");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to the server. Please check your internet connection and try again.";
      setError(errorMessage);
      console.error("Magic link error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Access your Lawyer Diary workspace
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to sign in</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {info ? (
        <Alert>
          <AlertTitle>Almost there</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handlePasswordSignIn)}
          className="sap-form"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="you@lawfirm.pk"
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Continue
          </Button>
        </form>
      </Form>

      <Separator className="my-6" />

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Prefer passwordless?
          </h2>
          <p className="text-xs text-muted-foreground">
            We&apos;ll email you a secure, single-use link.
          </p>
        </div>

        <Form {...magicForm}>
          <form
            onSubmit={magicForm.handleSubmit(handleMagicLink)}
            className="sap-form"
          >
            <FormField
              control={magicForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="you@lawfirm.pk"
                      autoComplete="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Email magic link
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}


