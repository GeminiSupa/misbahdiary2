# Email Code (OTP) Signup Setup + 15‑Day Trial

This project now supports **email sign-up with a code**:

1. User enters **Full name + Email + Password**
2. App sends a **verification code** to the email (Supabase OTP)
3. User enters the code → user is signed in
4. App sets the **password** on the verified user
5. User proceeds to onboarding → **15‑day trial** is started when the firm is created

---

## What to enable in Supabase

### 1) Enable Email OTP

In Supabase Dashboard:
- Authentication → Providers → Email
- Enable **Email OTP** (you said you already enabled it)

### 2) URL Configuration (important)

Authentication → URL Configuration:

- **Site URL**:
  - Production: `https://misbahdiary2.vercel.app`
  - Local dev: `http://localhost:3000`

- **Redirect URLs** (add both):
  - `https://misbahdiary2.vercel.app/**`
  - `http://localhost:3000/**`

---

## What to set in Vercel env vars

Vercel Dashboard → Project → Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://xsdqwbcpvdreawkyvpnk.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Supabase Dashboard → Settings → API → **anon/public** key)
- `NEXT_PUBLIC_SITE_URL` = `https://misbahdiary2.vercel.app`
- `SUPABASE_SERVICE_ROLE_KEY` = (Supabase Dashboard → Settings → API → **service_role/secret** key)

Notes:
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Google Client ID/Secret go in **Supabase Google provider**, not in Vercel env.

---

## Where the code lives

- Email OTP sign-up UI: `components/auth/sign-up-form.tsx`
- OAuth callback (Google): `app/auth/callback/route.ts`
- Public auth routes allowed by middleware: `middleware.ts`
- 15-day trial is created during onboarding: `app/onboarding/actions.ts`
- Trial/subscription enforcement: `lib/server/subscription-check.ts` + `middleware.ts`

---

## How trial + blocking works

- Trial starts when onboarding creates the firm:
  - `subscription_status = "trial"`
  - `trial_ends_at = now + 15 days`
- After trial expires, middleware redirects protected pages to `/subscription`.

