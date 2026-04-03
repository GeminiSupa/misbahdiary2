"use client";

import { useEffect } from "react";

/**
 * If Supabase redirects magic-link tokens in the URL hash to /sign-in (misconfigured Site URL),
 * move the user to /auth/callback so the client can read the hash and persist the session.
 */
export function MagicLinkHashRecovery() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
    if (!normalizedPath.endsWith("/sign-in")) {
      return;
    }
    const hash = window.location.hash;
    if (!hash || (!hash.includes("access_token") && !hash.includes("type=magiclink"))) {
      return;
    }

    const url = new URL(window.location.href);
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
