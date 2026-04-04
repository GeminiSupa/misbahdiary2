"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

const SESSION_RETRIES = [0, 50, 150, 300, 500];

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();

  useEffect(() => {
    let cancelled = false;

    const waitForSession = async () => {
      const supabase = getBrowserClient();
      for (const ms of SESSION_RETRIES) {
        if (ms > 0) {
          await new Promise((r) => setTimeout(r, ms));
        }
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          return data.session;
        }
      }
      return null;
    };

    const complete = async () => {
      const params = new URLSearchParams(queryKey);
      const next = safeNextPath(params.get("next"));
      const isClientPortalDest = next.startsWith("/client");

      const failToSignIn = () => {
        if (isClientPortalDest) {
          router.replace("/client-login?error=link-expired");
        } else {
          router.replace("/sign-in?error=link-expired");
        }
      };

      const hashRaw = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
      const hashParams = new URLSearchParams(hashRaw);
      if (hashParams.get("error") || hashParams.get("error_code")) {
        failToSignIn();
        return;
      }

      const code = params.get("code");
      const oauthError = params.get("error");
      const oauthErrorDesc = params.get("error_description");

      if (oauthError) {
        if (isClientPortalDest) {
          router.replace("/client-login?error=link-expired");
        } else {
          router.replace(
            `/sign-in?error=${encodeURIComponent(oauthErrorDesc || oauthError || "Authentication failed.")}`,
          );
        }
        return;
      }

      try {
        const supabase = getBrowserClient();

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (!cancelled) {
              failToSignIn();
            }
            return;
          }
        }

        const session = await waitForSession();
        if (!session) {
          if (!cancelled) {
            failToSignIn();
          }
          return;
        }

        router.replace(next);
        router.refresh();
      } catch {
        if (!cancelled) {
          failToSignIn();
        }
      }
    };

    void complete();
    return () => {
      cancelled = true;
    };
  }, [router, queryKey]);

  return (
    <div className="space-y-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Completing sign in</h1>
      <p className="text-sm text-muted-foreground">Please wait while we securely sign you in.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 px-4 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Completing sign in</h1>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
