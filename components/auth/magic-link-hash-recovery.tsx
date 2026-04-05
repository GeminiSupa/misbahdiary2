"use client";

import { useEffect } from "react";

/**
 * When Supabase finishes email/magic-link login, it must redirect to an allowlisted URL.
 * If `https://yoursite.com/auth/callback` is missing in Supabase → Authentication → URL config,
 * Supabase falls back to the Site URL (often the marketing homepage `/`). Tokens then land as
 * `?code=` (PKCE) or in the hash — and the session is never saved unless we forward to `/auth/callback`.
 *
 * Handles: `/` and `/sign-in` with `code` or magic-link hash fragments.
 */
export function MagicLinkHashRecovery() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
    const isSignIn = normalizedPath.endsWith("/sign-in");
    const isRoot = normalizedPath === "/";
    if (!isSignIn && !isRoot) {
      return;
    }

    const url = new URL(window.location.href);
    const hasCode = url.searchParams.has("code");
    const hash = url.hash;
    const hasHashTokens =
      Boolean(hash) &&
      (hash.includes("access_token") ||
        hash.includes("refresh_token") ||
        hash.includes("type=magiclink"));

    if (hasCode) {
      url.pathname = "/auth/callback";
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      if (!url.searchParams.get("next")) {
        url.searchParams.set("next", "/dashboard");
      }
      window.location.replace(url.toString());
      return;
    }

    if (!hasHashTokens) {
      return;
    }

    url.pathname = "/auth/callback";
    url.searchParams.delete("error");
    url.searchParams.delete("error_description");
    if (!url.searchParams.get("next")) {
      url.searchParams.set("next", "/dashboard");
    }
    window.location.replace(url.toString());
  }, []);

  return null;
}
