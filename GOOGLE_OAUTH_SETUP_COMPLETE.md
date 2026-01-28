# Complete Google OAuth Setup Guide - From Scratch

## Step 1: Delete Existing Google OAuth Configuration

### In Supabase:
1. Go to: [Supabase Dashboard → Auth → Providers → Google](https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/auth/providers)
2. Turn OFF the "Enabled" toggle
3. Clear the "Client ID" and "Client Secret" fields
4. Click **Save**

### In Google Cloud Console:
1. Go to: [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Click on it to edit
4. Remove all entries from:
   - **Authorized JavaScript origins**
   - **Authorized redirect URIs**
5. Click **Save** (or delete the OAuth client entirely if you want to start fresh)

---

## Step 2: Create/Get Google OAuth Credentials

### A. Create OAuth Consent Screen (if not done)

1. Go to: [Google Cloud Console → APIs & Services → OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Select **External** user type
3. Fill in:
   - **App name**: `Lawyer Diary` (or your app name)
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **Save and Continue**
5. **Scopes**: Click "Add or Remove Scopes"
   - Select: `email`, `profile`, `openid`
   - Click **Update**, then **Save and Continue**
6. **Test users** (if in Testing mode):
   - Add your email as a test user
   - Click **Save and Continue**
7. Click **Back to Dashboard**

### B. Create OAuth 2.0 Client ID

1. Go to: [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. **Application type**: Select **Web application**
4. **Name**: `Lawyer Diary OAuth` (or any name)
5. **Authorized JavaScript origins**: Click **+ ADD URI**
   - Add: `https://misbahdiary2.vercel.app`
   - Add: `https://xsdqwbcpvdreawkyvpnk.supabase.co`
   - Click **+ ADD URI** for each one
6. **Authorized redirect URIs**: Click **+ ADD URI**
   - Add: `https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback`
   - (This is the Supabase callback URL - copy it exactly)
7. Click **CREATE**
8. **IMPORTANT**: Copy these values:
   - **Client ID**: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`
   - **Client secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **Save these immediately - you won't see the secret again!**

---

## Step 3: Configure Supabase

1. Go to: [Supabase Dashboard → Auth → Providers → Google](https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/auth/providers)
2. Turn ON the **Enabled** toggle
3. Paste your **Client ID** (from Step 2B)
4. Paste your **Client Secret** (from Step 2B)
5. Click **Save**

### Also configure URL settings:

1. Go to: [Supabase Dashboard → Authentication → URL Configuration](https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/auth/url-configuration)
2. **Site URL**: `https://misbahdiary2.vercel.app`
3. **Redirect URLs**: Click **Add URL**
   - Add: `https://misbahdiary2.vercel.app/**`
   - Add: `http://localhost:3000/**` (for local development)
4. Click **Save changes**

---

## Step 4: Configure .env.local File

**Location**: `/Users/apple/Desktop/LawerDiary copy/.env.local`

**Add these variables:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xsdqwbcpvdreawkyvpnk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Site URL (must match Supabase Site URL exactly)
NEXT_PUBLIC_SITE_URL=https://misbahdiary2.vercel.app

# Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Where to get these values:

1. **NEXT_PUBLIC_SUPABASE_URL**: 
   - Already set: `https://xsdqwbcpvdreawkyvpnk.supabase.co`
   - Or get from: [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/settings/api)

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**:
   - Get from: [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/settings/api)
   - Look for **"anon" "public"** key
   - Copy the entire key

3. **NEXT_PUBLIC_SITE_URL**:
   - Your Vercel app URL: `https://misbahdiary2.vercel.app`
   - Must match Supabase "Site URL" exactly

4. **SUPABASE_SERVICE_ROLE_KEY**:
   - Get from: [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/settings/api)
   - Look for **"service_role" "secret"** key
   - ⚠️ **Keep this secret - never expose it in client-side code!**

### ⚠️ Important Notes:

- **DO NOT** put Google Client ID/Secret in `.env.local`
- Google credentials go in **Supabase Dashboard** only
- `.env.local` is for local development
- For Vercel, add these same variables in: **Vercel Dashboard → Settings → Environment Variables**

---

## Step 5: Configure Vercel Environment Variables

1. Go to: [Vercel Dashboard → Your Project → Settings → Environment Variables](https://vercel.com/dashboard)
2. Add these variables (same as `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=https://xsdqwbcpvdreawkyvpnk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_SITE_URL=https://misbahdiary2.vercel.app
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

3. Make sure **Production**, **Preview**, and **Development** are all selected
4. Click **Save**

---

## Step 6: Verify Configuration

### Checklist:

- [ ] Google OAuth Client ID created in Google Cloud Console
- [ ] Google Client ID and Secret pasted in Supabase
- [ ] Google OAuth enabled in Supabase
- [ ] Supabase Site URL set to: `https://misbahdiary2.vercel.app`
- [ ] Supabase Redirect URLs include: `https://misbahdiary2.vercel.app/**`
- [ ] `.env.local` file has all required variables
- [ ] Vercel environment variables are set
- [ ] Google Cloud Console has correct Authorized JavaScript origins
- [ ] Google Cloud Console has correct Authorized redirect URI

---

## Step 7: Test

1. **Restart your local dev server** (if running):
   ```bash
   npm run dev
   ```

2. **Go to**: `https://misbahdiary2.vercel.app/sign-in`

3. **Click "Sign in with Google"**

4. **Check browser console** (F12) for any errors

5. **Check Supabase Auth Logs**: [Auth Logs](https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/logs/auth-logs)

---

## Quick Reference: Where to Get What

| What You Need | Where to Get It |
|--------------|----------------|
| **Google Client ID** | Google Cloud Console → Credentials → OAuth Client ID |
| **Google Client Secret** | Google Cloud Console → Credentials → OAuth Client ID (shown once) |
| **Supabase Anon Key** | Supabase Dashboard → Settings → API → "anon" "public" key |
| **Supabase Service Role Key** | Supabase Dashboard → Settings → API → "service_role" "secret" key |
| **Supabase URL** | Already known: `https://xsdqwbcpvdreawkyvpnk.supabase.co` |
| **Site URL** | Your Vercel app: `https://misbahdiary2.vercel.app` |

---

## Common Issues

### Issue: "Invalid Origin" error
- **Fix**: Make sure Authorized JavaScript origins is just the domain (no `/**`, no trailing slash)
- Example: `https://misbahdiary2.vercel.app` ✅
- NOT: `https://misbahdiary2.vercel.app/**` ❌

### Issue: "redirect_uri_mismatch"
- **Fix**: Make sure Authorized redirect URI is exactly: `https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback`
- Copy it from Supabase Dashboard → Auth → Providers → Google

### Issue: "500 Unexpected failure"
- **Fix**: Make sure Google OAuth is enabled in Supabase and credentials are correct

### Issue: Still not working
- **Check**: Supabase Auth Logs for the exact error message
- **Check**: Browser console for client-side errors
- **Verify**: All environment variables are set correctly
