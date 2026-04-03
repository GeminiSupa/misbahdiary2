"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getBrowserClient(), []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const complete = async () => {
      const next = safeNextPath(searchParams.get("next"));
      const code = searchParams.get("code");
      const oauthError = searchParams.get("error");
      const oauthErrorDesc = searchParams.get("error_description");

      if (oauthError) {
        router.replace(
          `/sign-in?error=${encodeURIComponent(oauthErrorDesc || oauthError || "Authentication failed.")}`,
        );
        return;
      }

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (!cancelled) {
              setError(exchangeError.message || "Failed to complete sign in.");
            }
            return;
          }
        } else {
          await new Promise((r) => setTimeout(r, 0));
          const { data: s1 } = await supabase.auth.getSession();
          if (!s1.session) {
            await new Promise((r) => setTimeout(r, 150));
            const { data: s2 } = await supabase.auth.getSession();
            if (!s2.session) {
              if (!cancelled) {
                setError(
                  "Could not establish a session from this link. If tokens are in the URL hash, ensure you opened the link to /auth/callback (not /sign-in).",
                );
              }
              return;
            }
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) {
            setError("Session not available after sign in.");
          }
          return;
        }

        router.replace(next);
        router.refresh();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong.");
        }
      }
    };

    void complete();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams, supabase]);

  return (
    <div className="space-y-4 text-center px-4">
      <h1 className="text-2xl font-semibold text-foreground">Completing sign in</h1>
      <p className="text-sm text-muted-foreground">
        {error ?? "Please wait while we securely sign you in."}
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 text-center px-4">
          <h1 className="text-2xl font-semibold text-foreground">Completing sign in</h1>
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
