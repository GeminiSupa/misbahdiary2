"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ClientLoginInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const tokenOk = Boolean(token && UUID_RE.test(token));

  useEffect(() => {
    if (!tokenOk || error === "link-expired") {
      return;
    }
    const url = `/api/auth/magic-redirect?token=${encodeURIComponent(token!)}`;
    window.location.replace(url);
  }, [token, tokenOk, error]);

  if (error === "link-expired") {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-white sm:text-2xl">Link no longer valid</h1>
        <p className="text-sm leading-relaxed text-white/75">
          This link has expired or was already used. Please contact your lawyer to send a new client portal login
          email.
        </p>
        <p className="text-xs text-white/50">
          Need help? Use the same email address your lawyer has on file for you.
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-white sm:text-2xl">Invalid link</h1>
        <p className="text-sm text-white/75">Open the login link from your email, or ask your lawyer to resend it.</p>
        <Link href="/sign-in" className="text-sm font-medium text-blue-400 underline-offset-4 hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  if (!tokenOk) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-white sm:text-2xl">Invalid link</h1>
        <p className="text-sm text-white/75">This login link is not valid. Ask your lawyer to send a new client portal email.</p>
        <Link href="/sign-in" className="text-sm font-medium text-blue-400 underline-offset-4 hover:underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  const continueUrl = `/api/auth/magic-redirect?token=${encodeURIComponent(token)}`;

  return (
    <div className="space-y-6 text-center">
      <h1 className="text-xl font-semibold text-white sm:text-2xl">Client portal</h1>
      <p className="text-sm leading-relaxed text-white/80">Opening your secure sign-in link…</p>
      <p className="text-xs text-white/45">
        If nothing happens,{" "}
        <a href={continueUrl} className="font-medium text-blue-400 underline-offset-4 hover:underline">
          tap here to continue
        </a>
        .
      </p>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3 text-center">
          <h1 className="text-xl font-semibold text-white">Client portal</h1>
          <p className="text-sm text-white/60">Loading…</p>
        </div>
      }
    >
      <ClientLoginInner />
    </Suspense>
  );
}
