# OAuth Configuration Check Results

Based on your codebase analysis, here's what I found:

## ✅ Code Configuration (What Your App Uses)

### Redirect URLs in Your Code:

1. **Client-side OAuth** (`components/auth/sign-in-form.tsx`):
   - Primary: `window.location.origin + "/auth/callback"`
   - Fallback: `process.env.NEXT_PUBLIC_SITE_URL + "/auth/callback"`
   - Example: `http://localhost:3000/auth/callback` (local) or `https://your-app.vercel.app/auth/callback` (production)

2. **Server-side OAuth** (`app/(auth)/sign-in/actions.ts`):
   - Uses: `process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? "http://localhost:3000"`
   - Then: `${siteUrl}/auth/callback`
   - Example: `http://localhost:3000/auth/callback` (local) or `https://your-app.vercel.app/auth/callback` (production)

### Supabase Project ID (from your code):
- **Project ID**: `xsdqwbcpvdreawkyvpnk`
- **Supabase URL**: `https://xsdqwbcpvdreawkyvpnk.supabase.co`
- **Supabase Callback URL**: `https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback`

---

## ⚠️ Required Configuration (What You Need to Set)

### 1. Supabase Dashboard → Authentication → URL Configuration

**Site URL** (must match exactly):
```
http://localhost:3000          (for local development)
https://your-vercel-app.vercel.app  (for production - replace with your actual Vercel URL)
```

**Redirect URLs** (add both):
```
http://localhost:3000/**
https://your-vercel-app.vercel.app/**
```

⚠️ **CRITICAL**: 
- No trailing slashes
- Must include protocol (`http://` or `https://`)
- Use wildcard pattern `/**` (recommended by Supabase)

---

### 2. Google Cloud Console → Credentials → OAuth Client ID

**Authorized JavaScript origins** (add):
```
https://xsdqwbcpvdreawkyvpnk.supabase.co
```

**Authorized redirect URIs** (add - THIS IS THE MOST IMPORTANT):
```
https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback
```

⚠️ **CRITICAL**: 
- This URL must match **exactly** character-for-character
- Copy it from: **Supabase Dashboard → Auth → Providers → Google** (it's shown there)
- This is where Google redirects AFTER authentication

---

### 3. Supabase Dashboard → Authentication → Providers → Google

✅ **Enabled**: Toggle must be ON
✅ **Client ID**: Paste from Google Cloud Console
✅ **Client Secret**: Paste from Google Cloud Console
✅ **Save**: Click the Save button (don't forget!)

---

### 4. Environment Variables (Vercel Dashboard)

Set these in **Vercel → Your Project → Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xsdqwbcpvdreawkyvpnk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=https://your-vercel-app.vercel.app
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **CRITICAL**: 
- `NEXT_PUBLIC_SITE_URL` must match Supabase "Site URL" **exactly**
- No trailing slashes
- Must include `https://`

---

### 5. Google Cloud Console → OAuth Consent Screen

✅ **App status**: `Testing` or `Published`
✅ **User type**: `External` → add your email as **Test User** (if Testing mode)
✅ **Scopes**: Must include:
   - `email`
   - `profile`
   - `openid`

---

## 🔍 How to Verify Your Configuration

### Step 1: Check Supabase Auth Logs
1. Go to: https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/logs/auth-logs
2. Look for your recent OAuth attempt
3. Check the error message - it will tell you exactly what's wrong

**Common errors:**
- `redirect_uri_mismatch` → URL configuration issue (95% of cases)
- `invalid_client` → Google OAuth not configured in Supabase
- `access_denied` → User denied or consent screen issue
- `PKCE code verifier not found` → Cookie issue

### Step 2: Test OAuth URL Generation
Run this in your browser console (on your app):
```javascript
// This will show you what redirect URL is being used
console.log('Site URL:', process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
console.log('Redirect URL:', (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin) + '/auth/callback');
```

### Step 3: Verify URLs Match

**Checklist:**
- [ ] Supabase "Site URL" = `NEXT_PUBLIC_SITE_URL` environment variable
- [ ] Supabase "Redirect URLs" includes `NEXT_PUBLIC_SITE_URL/**`
- [ ] Google "Authorized redirect URI" = `https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback`
- [ ] Google "Authorized JavaScript origins" includes `https://xsdqwbcpvdreawkyvpnk.supabase.co`

---

## 📊 Based on Your Log

From the Supabase auth log you shared:
- ✅ OAuth callback received successfully (302 redirect)
- ✅ No Supabase errors (`x_sb_error_code: null`)
- ✅ Code received from Google
- ✅ State parameter shows: `"site_url":"http://localhost:3000"`

**This means:**
1. Google OAuth is working ✅
2. Supabase received the callback ✅
3. Supabase is redirecting to `http://localhost:3000/auth/callback` ✅

**Next step:** Check if your Next.js app is receiving the redirect and processing it correctly. Check your Next.js server logs for messages from `app/auth/callback/route.ts`.

---

## 🚀 Quick Fix Checklist

1. **Supabase Dashboard → Auth → URL Configuration:**
   - [ ] Site URL: `http://localhost:3000` (or your production URL)
   - [ ] Redirect URLs: `http://localhost:3000/**` (and production URL)

2. **Google Cloud Console → Credentials:**
   - [ ] Authorized redirect URI: `https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback`

3. **Supabase Dashboard → Auth → Providers → Google:**
   - [ ] Enabled: ON
   - [ ] Client ID: Set
   - [ ] Client Secret: Set
   - [ ] Saved

4. **Vercel Environment Variables:**
   - [ ] `NEXT_PUBLIC_SITE_URL` matches Supabase Site URL exactly

---

## 💡 Still Not Working?

1. **Check Supabase Auth Logs** - This is where the real errors are:
   https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/logs/auth-logs

2. **Check Next.js Server Logs** - Look for messages from `/auth/callback` route

3. **Check Browser Network Tab** - Look for the `/auth/callback` request

4. **Share the specific error** from Supabase Auth Logs - that will tell us exactly what's wrong
