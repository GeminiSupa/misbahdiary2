"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const signUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    fullName: z.string().min(2, "Enter your full name"),
  })
  .refine(
    (value) => value.password.trim().length >= 8,
    "Password must be at least 8 characters long",
  );

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpForm() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  const handleSignUp = async (values: SignUpValues) => {
    if (!supabase) {
      setError("Authentication service is not ready. Please try again.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Step 1: Create user account via server action (with email_confirm: true)
      const { signUpWithImmediateAccess } = await import("@/app/(auth)/sign-up/actions");
      
      const result = await signUpWithImmediateAccess({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      });

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Step 2: Sign in the user on the client side (user is already confirmed)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });

      if (signInError) {
        setError(signInError.message || "Account created but unable to sign in. Please try signing in manually.");
        setIsSubmitting(false);
        return;
      }

      // Success - user is signed in, redirect to home page
      // The home page will check if user has a firm and redirect to onboarding if needed
      router.replace("/");
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Create account</h1>
        <p className="mt-2 text-sm text-white/70 sm:text-base">
          Start managing cases, clients, and hearings in one place.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 backdrop-blur-sm">
          <AlertTitle className="text-red-200">Unable to sign up</AlertTitle>
          <AlertDescription className="text-red-300/90">{error}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-5">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/90">Full name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Adv. Ayesha Khan"
                    autoComplete="name"
                    className="h-12 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-200"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

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
                    autoComplete="new-password"
                    className="h-12 bg-slate-700/50 border-slate-600/50 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-200"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <div className="flex justify-center w-full">
            <Button
              type="submit"
              className="w-full sm:w-auto h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 border-0 min-h-[44px] sm:min-h-[48px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                  <span className="whitespace-nowrap">Creating account...</span>
                </>
              ) : (
                <span className="whitespace-nowrap">Create account</span>
              )}
            </Button>
          </div>
        </form>
      </Form>

      <div className="pt-2 text-center text-sm text-white/70">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-white underline underline-offset-4 hover:text-white/90">
          Sign in
        </Link>
      </div>
    </div>
  );
}


