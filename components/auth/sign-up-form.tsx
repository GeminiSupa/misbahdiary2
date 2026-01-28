"use client";

import { useMemo, useState } from "react";
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
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    fullName: z.string().min(2, "Enter your full name"),
  })
  .refine(
    (value) => value.password.trim().length >= 8,
    "Password must be at least 8 characters long",
  );

const verifySchema = z.object({
  code: z
    .string()
    .min(4, "Enter the code from your email")
    .max(12, "Enter the code from your email"),
});

type SignUpValues = z.infer<typeof signUpSchema>;
type VerifyValues = z.infer<typeof verifySchema>;

export function SignUpForm() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step, setStep] = useState<"request" | "verify">("request");
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [pendingPassword, setPendingPassword] = useState<string>("");
  const [pendingFullName, setPendingFullName] = useState<string>("");

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  const verifyForm = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  });

  const siteUrl = useMemo(() => {
    if (typeof window === "undefined") return process.env.NEXT_PUBLIC_SITE_URL ?? "";
    return process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
  }, []);

  const callbackUrl = useMemo(() => {
    // Used by Supabase in some auth flows; safe to provide here too.
    const base = siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
    return base ? `${base}/auth/callback` : "";
  }, [siteUrl]);

  const sendOtp = async (values: SignUpValues) => {
    if (!supabase) {
      setError("Authentication service is not ready. Please try again.");
      return;
    }

    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    // Store in memory only (do NOT persist). We need the password after OTP verification.
    const email = values.email.trim();
    const password = values.password;
    const fullName = values.fullName.trim();
    setPendingEmail(email);
    setPendingPassword(password);
    setPendingFullName(fullName);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // keep metadata for profile creation / onboarding
        data: { full_name: fullName },
        ...(callbackUrl ? { emailRedirectTo: callbackUrl } : {}),
      },
    });

    setIsSubmitting(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setInfo("We sent a verification code to your email. Enter it below to finish creating your account.");
    setStep("verify");
    verifyForm.reset({ code: "" });
  };

  const verifyOtpAndSetPassword = async (values: VerifyValues) => {
    if (!supabase) {
      setError("Authentication service is not ready. Please try again.");
      return;
    }
    if (!pendingEmail || !pendingPassword) {
      setError("Please start again and request a new code.");
      setStep("request");
      return;
    }

    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      const token = values.code.trim();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token,
        type: "email",
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      // Now the user is signed in via OTP; set their password to enable password sign-in later.
      const { error: updateError } = await supabase.auth.updateUser({
        password: pendingPassword,
        data: pendingFullName ? { full_name: pendingFullName } : undefined,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Clear sensitive data ASAP
      setPendingPassword("");

      router.replace("/");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    if (!supabase) {
      setError("Authentication service is not ready. Please try again.");
      return;
    }
    if (!pendingEmail) {
      setError("Please enter your email first.");
      setStep("request");
      return;
    }

    setError(null);
    setInfo(null);
    setIsSubmitting(true);
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email: pendingEmail,
      options: {
        shouldCreateUser: true,
        ...(pendingFullName ? { data: { full_name: pendingFullName } } : {}),
        ...(callbackUrl ? { emailRedirectTo: callbackUrl } : {}),
      },
    });
    setIsSubmitting(false);

    if (resendError) {
      setError(resendError.message);
      return;
    }
    setInfo("We sent a new verification code. Please check your inbox.");
  };

  // Wait for supabase client to be initialized
  if (!supabase) {
    return (
      <div className="space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Create account</h1>
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

      {info ? (
        <Alert className="border-blue-500/50 bg-blue-500/10 backdrop-blur-sm">
          <AlertTitle className="text-blue-200">Next step</AlertTitle>
          <AlertDescription className="text-blue-300/90">{info}</AlertDescription>
        </Alert>
      ) : null}

      {step === "request" ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(sendOtp)} className="space-y-5">
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

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 border-0 min-h-[44px] sm:min-h-[48px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send verification code"
              )}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...verifyForm}>
          <form
            onSubmit={verifyForm.handleSubmit(verifyOtpAndSetPassword)}
            className="space-y-5"
          >
            <FormField
              control={verifyForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white/90">Verification code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="numeric"
                      placeholder="Enter the code from your email"
                      autoComplete="one-time-code"
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
                  Verifying...
                </>
              ) : (
                "Verify & create account"
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  setStep("request");
                }}
                className="text-muted-foreground hover:text-foreground underline underline-offset-4"
                disabled={isSubmitting}
              >
                Change email
              </button>

              <button
                type="button"
                onClick={resendCode}
                className="text-white/70 hover:text-white underline underline-offset-4"
                disabled={isSubmitting}
              >
                Resend code
              </button>
            </div>
          </form>
        </Form>
      )}

      <div className="pt-2 text-center text-sm text-white/70">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-white underline underline-offset-4 hover:text-white/90">
          Sign in
        </Link>
      </div>
    </div>
  );
}


