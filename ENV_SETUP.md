# Environment Variables Setup Guide

## Required Supabase Environment Variables

Your `.env.local` file needs these variables for the app to work:

### 1. **NEXT_PUBLIC_SUPABASE_URL**
- **Format**: `https://[project-id].supabase.co`
- **Your Project ID**: `xsdqwbcpvdreawkyvpnk`
- **Your URL should be**: `https://xsdqwbcpvdreawkyvpnk.supabase.co`

### 2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
- This is your Supabase **anon/public** key (NOT the service_role key)
- Get it from: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### 3. **SUPABASE_SERVICE_ROLE_KEY** (Optional, for admin operations)
- This is your Supabase **service_role** key
- Get it from: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
- ⚠️ **Keep this secret!** Never expose it in client-side code.

## How to Get Your Supabase Keys

1. Go to: **https://app.supabase.com**
2. Select your project (ID: `xsdqwbcpvdreawkyvpnk`)
3. Navigate to: **Settings** → **API**
4. Copy the following:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → Use for `SUPABASE_SERVICE_ROLE_KEY` (optional)

## Example .env.local File

Create or update your `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xsdqwbcpvdreawkyvpnk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Project ID (for reference)
SUPABASE_PROJECT_ID=xsdqwbcpvdreawkyvpnk
```

## MailerSend (optional – welcome & subscription emails)

To send **welcome emails** after onboarding and **subscription success emails** after payment, add:

- **MAILERSEND_API_KEY** – Your MailerSend API key from [MailerSend](https://www.mailersend.com/) → API Tokens.
- **MAILERSEND_FROM_EMAIL** – Sender email (must use a [verified domain](https://www.mailersend.com/help/domains) in MailerSend). Default: `noreply@lawerdiary.com`.
- **MAILERSEND_FROM_NAME** – Sender display name. Default: `Lawyer Diary`.

If these are not set, onboarding and subscription still work; only the notification emails are skipped.

## Important Notes

- **NEXT_PUBLIC_** prefix is required for variables used in client-side code
- Never commit `.env.local` to git (it should be in `.gitignore`)
- Restart your dev server after adding/changing environment variables
- For Vercel deployment, add these same variables in Vercel Dashboard → Settings → Environment Variables

## After Adding Variables

1. Save the `.env.local` file
2. Restart your development server:
   ```bash
   npm run dev
   ```
3. The warnings should disappear and sign-in should work!

