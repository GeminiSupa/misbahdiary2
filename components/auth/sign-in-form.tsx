"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  const [error, setError] = useState<string | null>(() => {
    const errorParam = params.get("error");
    if (errorParam) {
      // Decode error message if it's URL encoded
      try {
        return decodeURIComponent(errorParam);
      } catch {
        return errorParam;
      }
    }
    return null;
  });
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

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
    if (!supabase) {
      setError("Authentication service is not ready. Please try again.");
      return;
    }

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

  const handleGoogleSignIn = async () => {
    console.log("🔵 Google Sign-In button clicked");
    setError(null);
    setInfo(null);
    setIsOAuthLoading(true);

    // Check Supabase client first
    if (!supabase) {
      console.error("❌ Supabase client is null!");
      setError("Authentication service is not ready. Please refresh the page and try again.");
      setIsOAuthLoading(false);
      return;
    }

    console.log("✅ Supabase client is available");

    // Suppress known Google OAuth accessibility warnings (these are from Google's UI, not our code)
    // This warning appears in Google's account chooser and doesn't affect functionality
    const originalWarn = console.warn;
    const originalError = console.error;
    const suppressGoogleOAuthWarnings = () => {
      console.warn = (...args: unknown[]) => {
        const message = typeof args[0] === "string" ? args[0] : String(args[0]);
        // Suppress Google OAuth account chooser accessibility warnings
        if (
          message.includes("aria-hidden") &&
          (message.includes("accountchooser") || message.includes("apps.google"))
        ) {
          // Silently ignore - this is a known Google OAuth UI issue
          return;
        }
        originalWarn.apply(console, args);
      };
      
      console.error = (...args: unknown[]) => {
        const message = typeof args[0] === "string" ? args[0] : String(args[0]);
        // Suppress Google OAuth account chooser accessibility warnings
        if (
          message.includes("aria-hidden") &&
          (message.includes("accountchooser") || message.includes("apps.google"))
        ) {
          // Silently ignore - this is a known Google OAuth UI issue
          return;
        }
        originalError.apply(console, args);
      };
    };

    // Restore original console methods after redirect (cleanup)
    const restoreConsole = () => {
      console.warn = originalWarn;
      console.error = originalError;
    };

    // Suppress warnings before redirect
    suppressGoogleOAuthWarnings();

    // IMPORTANT: redirectTo MUST use the same hostname the user is currently on.
    // Example bug: user visits http://0.0.0.0:3000 but redirectTo is http://localhost:3000/auth/callback
    // -> PKCE cookie is set for one host, callback returns to another -> "PKCE code verifier not found".
    const redirectUrl = window.location.origin.concat("/auth/callback");

    console.log("🔗 Redirect URL:", redirectUrl);
    console.log("🔗 Site URL env:", process.env.NEXT_PUBLIC_SITE_URL);
    console.log("🔗 Window origin:", window.location.origin);

    try {
      console.log("🔄 Initiating client-side OAuth (required for PKCE cookie storage):", redirectUrl);

      // Use client-side OAuth - createBrowserClient from @supabase/ssr automatically
      // stores the PKCE code verifier in cookies with the correct attributes (SameSite, Secure)
      // Let Supabase handle the redirect automatically - this ensures cookies are set correctly
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          // Let Supabase handle the redirect automatically
          // This ensures the PKCE code verifier cookie is set with correct attributes
          // (SameSite=None, Secure=true) for cross-origin redirects
        },
      });

      if (oauthError) {
        restoreConsole(); // Restore console before showing error
        console.error("❌ OAuth initiation failed:", oauthError);
        console.error("❌ Full error details:", JSON.stringify(oauthError, null, 2));
        setError(oauthError.message || "Failed to sign in with Google. Please try again.");
        setIsOAuthLoading(false);
        return;
      }
      
      // If we get here, Supabase will automatically redirect the browser
      // The PKCE code verifier cookie will be set with correct attributes
      console.log("✅ OAuth initiated, Supabase will redirect to Google automatically...");
      console.log("🔐 PKCE code verifier cookie will be set automatically by @supabase/ssr");
      
      // Supabase will handle the redirect automatically
      // No need to manually redirect - this ensures cookies are set correctly
    } catch (err) {
      restoreConsole(); // Restore console before showing error
      console.error("❌ Exception in Google OAuth:", err);
      console.error("❌ Error stack:", err instanceof Error ? err.stack : "No stack trace");
      const errorMessage = err instanceof Error ? err.message : "Failed to connect to the server. Please check your internet connection and try again.";
      setError(errorMessage);
      setIsOAuthLoading(false);
    }
  };

  const handleMagicLink = async (values: MagicLinkFormValues) => {
    if (!supabase) {
      setError("Authentication service is not ready. Please try again.");
      return;
    }

    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: values.email.trim(),
        options: {
          emailRedirectTo: window.location.origin.concat("/auth/callback"),
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

  // Wait for supabase client to be initialized (after all hooks are called)
  if (!supabase) {
    return (
      <div className="space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Welcome Back</h1>
          <p className="mt-2 text-sm text-white/70 sm:text-base">
            Loading...
          </p>
        </div>
      </div>
    );
  }

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

      {/* Google OAuth Button - Force Vercel rebuild */}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isOAuthLoading || isSubmitting}
        className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 font-semibold shadow-md hover:shadow-lg transition-all duration-200 border border-gray-300 min-h-[44px] sm:min-h-[48px] flex items-center justify-center gap-3"
      >
        {isOAuthLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Connecting to Google...</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Sign in with Google</span>
          </>
        )}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-800/95 px-2 text-white/50">Or continue with email</span>
        </div>
      </div>

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
            className="w-full h-12 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 border-0 min-h-[44px] sm:min-h-[48px]"
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

      <div className="pt-2 text-center text-sm text-white/70">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="text-white underline underline-offset-4 hover:text-white/90"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}


