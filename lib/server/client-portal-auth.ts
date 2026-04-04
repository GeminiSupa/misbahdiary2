import { randomUUID } from "crypto";
import { z } from "zod";
import { supabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Sends the client-login URL using Supabase Auth’s mailer (project SMTP / Gmail configured in the
 * Supabase Dashboard). This is the same mechanism as passwordless `signInWithOtp` elsewhere: it
 * POSTs to `/auth/v1/otp` and GoTrue sends the “Magic link” template email.
 *
 * Email subject and HTML/text body come from Dashboard → Authentication → Email Templates → Magic link.
 * To match “proxy only” UX, edit that template so the visible button/link points at `{{ .RedirectTo }}`
 * (your `/client-login?token=…` URL) and keep the real Supabase verify URL for the post–“Continue”
 * step via `client_portal_magic_link_tokens` + `/api/auth/magic-redirect`.
 */
async function sendClientPortalProxyLoginEmailViaSupabaseAuth(options: {
  normalizedEmail: string;
  clientLoginUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdminClient.auth.signInWithOtp({
    email: options.normalizedEmail,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: options.clientLoginUrl,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

const emailSchema = z.string().email();
const MAX_USER_SCAN_PAGES = 10;
const USERS_PER_PAGE = 1000;
const RESEND_WINDOW_MS = 60 * 1000; // 1 minute
const PROXY_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

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

function getPublicSiteBaseUrl(requestOrigin: string): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : requestOrigin)
  );
}

export function getPortalRedirectUrl(requestOrigin: string): string {
  const baseUrl = getPublicSiteBaseUrl(requestOrigin);
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

  const redirectTo = getPortalRedirectUrl(options.requestOrigin);

  const { data: linkData, error: linkError } = await supabaseAdminClient.auth.admin.generateLink({
    type: "magiclink",
    email: options.normalizedEmail,
    options: {
      redirectTo,
    },
  });

  if (linkError) {
    return {
      ok: false as const,
      message: linkError.message,
    };
  }

  const resolvedLink = linkData?.properties?.action_link;
  if (!resolvedLink || typeof resolvedLink !== "string") {
    return {
      ok: false as const,
      message: "Could not generate login link. Please try again.",
    };
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + PROXY_TOKEN_TTL_MS).toISOString();

  const { data: inserted, error: insertError } = await supabaseAdminClient
    .from("client_portal_magic_link_tokens")
    .insert({
      token,
      supabase_action_link: resolvedLink,
      expires_at: expiresAt,
    })
    .select("id")
    .maybeSingle();

  if (insertError || !inserted?.id) {
    return {
      ok: false as const,
      message: insertError?.message ?? "Could not store login link.",
    };
  }

  const baseUrl = getPublicSiteBaseUrl(options.requestOrigin);
  const clientLoginUrl = new URL("/client-login", baseUrl);
  clientLoginUrl.searchParams.set("token", token);

  const emailResult = await sendClientPortalProxyLoginEmailViaSupabaseAuth({
    normalizedEmail: options.normalizedEmail,
    clientLoginUrl: clientLoginUrl.toString(),
  });

  if (!emailResult.success) {
    await supabaseAdminClient.from("client_portal_magic_link_tokens").delete().eq("id", inserted.id);
    return {
      ok: false as const,
      message: emailResult.error ?? "Login link could not be sent via Supabase Auth email.",
    };
  }

  portalLinkRateLimit.set(key, now);
  return { ok: true as const };
}
