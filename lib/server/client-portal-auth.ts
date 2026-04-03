import { z } from "zod";
import { supabaseAdminClient } from "@/lib/supabase/admin";

const emailSchema = z.string().email();
const MAX_USER_SCAN_PAGES = 10;
const USERS_PER_PAGE = 1000;
const RESEND_WINDOW_MS = 60 * 1000; // 1 minute

const portalLinkRateLimit = new Map<string, number>();

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePortalEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

async function findAuthUserByEmail(normalizedEmail: string) {
  for (let page = 1; page <= MAX_USER_SCAN_PAGES; page += 1) {
    const { data, error } = await supabaseAdminClient.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });

    if (error) {
      throw new Error(`Unable to read auth users: ${error.message}`);
    }

    const found = data.users.find((user) => normalizeEmail(user.email ?? "") === normalizedEmail);
    if (found) {
      return found;
    }

    if (data.users.length < USERS_PER_PAGE) {
      break;
    }
  }

  return null;
}

export async function getOrCreateAuthUser(normalizedEmail: string) {
  const existing = await findAuthUserByEmail(normalizedEmail);
  if (existing) return existing;

  const { data, error } = await supabaseAdminClient.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already") || message.includes("exists") || message.includes("registered")) {
      const racedUser = await findAuthUserByEmail(normalizedEmail);
      if (racedUser) return racedUser;
    }
    throw new Error(`Unable to create auth user: ${error.message}`);
  }

  if (!data.user) {
    throw new Error("Auth user creation returned no user.");
  }

  return data.user;
}

function getPortalRedirectUrl(requestOrigin: string): string {
  // Prefer env (must match Supabase Auth redirect allow list). Dev fallback: localhost.
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : requestOrigin);
  const redirectUrl = new URL("/auth/callback", baseUrl);
  redirectUrl.searchParams.set("next", "/client/dashboard");
  return redirectUrl.toString();
}

function getRateLimitKey(email: string, scope: string): string {
  return `${scope}:${email}`;
}

export async function sendClientPortalMagicLink(options: {
  normalizedEmail: string;
  requestOrigin: string;
  scopeKey?: string;
}) {
  const scope = options.scopeKey ?? "default";
  const key = getRateLimitKey(options.normalizedEmail, scope);
  const now = Date.now();
  const previous = portalLinkRateLimit.get(key);

  if (typeof previous === "number" && now - previous < RESEND_WINDOW_MS) {
    const retryAfterSeconds = Math.ceil((RESEND_WINDOW_MS - (now - previous)) / 1000);
    return {
      ok: false as const,
      retryAfterSeconds,
      message: "Please wait before sending another login link.",
    };
  }

  const { error } = await supabaseAdminClient.auth.signInWithOtp({
    email: options.normalizedEmail,
    options: {
      emailRedirectTo: getPortalRedirectUrl(options.requestOrigin),
      shouldCreateUser: false,
    },
  });

  if (error) {
    return {
      ok: false as const,
      message: error.message,
    };
  }

  portalLinkRateLimit.set(key, now);
  return { ok: true as const };
}
