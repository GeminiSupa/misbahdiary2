"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ClientLoginInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");

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

  const continueUrl = `/api/auth/magic-redirect?token=${encodeURIComponent(token)}`;

  return (
    <div className="space-y-6 text-center">
      <h1 className="text-xl font-semibold text-white sm:text-2xl">Client portal</h1>
      <p className="text-sm leading-relaxed text-white/80">
        For your security, confirm below to open your one-time sign-in link. This helps prevent automated systems from
        using your login before you do.
      </p>
      <a
        href={continueUrl}
        className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        Continue to your dashboard
      </a>
      <p className="text-xs text-white/45">This step only takes a moment.</p>
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
