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
      // Check if Supabase is properly configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        setError("Supabase is not configured. Please contact your administrator.");
        setIsSubmitting(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });

      if (signInError) {
        // Handle specific error cases
        if (signInError.message.includes("fetch") || signInError.message.includes("network")) {
          setError("Unable to connect to the authentication server. Please check your internet connection and try again.");
        } else {
          setError(signInError.message || "Failed to sign in. Please check your credentials.");
        }
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to the server. Please check your internet connection and try again.";
      
      // Check for common network errors
      if (errorMessage.includes("fetch") || errorMessage.includes("Failed to fetch")) {
        setError("Unable to connect to the authentication server. Please check your internet connection and ensure Supabase is properly configured.");
      } else {
        setError(errorMessage);
      }
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
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Welcome Back</h1>
        <p className="mt-2 text-sm text-white/70 sm:text-base">
          Sign in to access your workspace
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
          <AlertTitle className="text-red-200">Unable to sign in</AlertTitle>
          <AlertDescription className="text-red-300/90">{error}</AlertDescription>
        </Alert>
      ) : null}

      {info ? (
        <Alert className="border-blue-500/50 bg-blue-500/10 backdrop-blur-sm">
          <AlertTitle className="text-blue-200">Almost there</AlertTitle>
          <AlertDescription className="text-blue-300/90">{info}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handlePasswordSignIn)}
          className="space-y-5"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="you@lawfirm.pk"
                    autoComplete="email"
                    className="h-12 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-200"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90">Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-12 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-200"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 border-0 min-h-[44px] sm:min-h-[48px]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-800/95 px-2 text-white/50">Or</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-medium text-white/90">
            Prefer passwordless?
          </h2>
          <p className="text-xs text-white/60 mt-1">
            We&apos;ll email you a secure, single-use link.
          </p>
        </div>

        <Form {...magicForm}>
          <form
            onSubmit={magicForm.handleSubmit(handleMagicLink)}
            className="space-y-4"
          >
            <FormField
              control={magicForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/90">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="you@lawfirm.pk"
                      autoComplete="email"
                      className="h-12 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-200"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="outline"
              className="w-full h-12 border-slate-600/50 bg-slate-700/30 text-white hover:bg-slate-700/50 hover:border-slate-500/50 backdrop-blur-sm transition-all duration-200 min-h-[44px] sm:min-h-[48px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Email magic link"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}


