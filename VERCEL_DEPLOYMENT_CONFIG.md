# Vercel Deployment Configuration for Google OAuth

## ✅ What You Need to Configure

### 1. Supabase Dashboard → Authentication → URL Configuration

**For Production (Vercel):**

**Site URL:**
```
https://your-app-name.vercel.app
```
(Replace `your-app-name` with your actual Vercel app name)

**Redirect URLs:**
```
https://your-app-name.vercel.app/**
```
(Use wildcard pattern to allow all paths)

**For Local Development (keep both):**

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs:**
```
http://localhost:3000/**
https://your-app-name.vercel.app/**
```
(Add both localhost and production URLs)

---

### 2. Vercel Dashboard → Your Project → Settings → Environment Variables

Add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://xsdqwbcpvdreawkyvpnk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **CRITICAL**: 
- `NEXT_PUBLIC_SITE_URL` must match Supabase "Site URL" **exactly**
- No trailing slashes
- Must include `https://`
- This is used to build the redirect URL: `${NEXT_PUBLIC_SITE_URL}/auth/callback`

---

### 3. Google Cloud Console → Credentials → OAuth Client ID

**Authorized JavaScript origins** (add both):
```
https://xsdqwbcpvdreawkyvpnk.supabase.co
https://your-app-name.vercel.app
```

**Authorized redirect URIs** (add - THIS IS CRITICAL):
```
https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback
```

⚠️ **Note**: The redirect URI is the Supabase callback URL, NOT your Vercel URL. Google redirects to Supabase first, then Supabase redirects to your app.

---

## 🔄 How It Works

1. User clicks "Sign in with Google" on your Vercel app
2. App redirects to Google with `redirectTo: https://your-app-name.vercel.app/auth/callback`
3. Google authenticates user
4. Google redirects to Supabase: `https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback`
5. Supabase processes OAuth and redirects to: `https://your-app-name.vercel.app/auth/callback`
6. Your callback route exchanges code for session

---

## ✅ Verification Steps

After deploying to Vercel:

1. **Test OAuth flow:**
   - Go to your Vercel app URL
   - Click "Sign in with Google"
   - Complete authentication
   - Should redirect to dashboard (not sign-in page)

2. **Check Vercel logs:**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for: `GET /auth/callback?code=...`
   - Should see: `🔔 OAuth Callback received: { hasCode: true, ... }`

3. **Check Supabase Auth Logs:**
   - Go to: https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/logs/auth-logs
   - Should see successful login events

---

## 🚨 Common Issues

### Issue 1: Redirect URL Mismatch
**Symptom:** Redirects to sign-in page instead of dashboard
**Fix:** Ensure `NEXT_PUBLIC_SITE_URL` in Vercel matches Supabase "Site URL" exactly

### Issue 2: PKCE Code Verifier Not Found
**Symptom:** Error after Google authentication
**Fix:** This should work automatically with `@supabase/ssr`. If it doesn't, check:
- Cookies are enabled in browser
- Not using incognito/private mode
- Cookie attributes allow cross-site redirects

### Issue 3: CORS Errors
**Symptom:** Browser console shows CORS errors
**Fix:** Ensure Google Cloud Console has your Vercel URL in "Authorized JavaScript origins"

---

## 📝 Summary

**Yes, it will work on Vercel IF you:**
1. ✅ Configure Supabase Redirect URLs with your Vercel URL
2. ✅ Set `NEXT_PUBLIC_SITE_URL` in Vercel environment variables
3. ✅ Ensure it matches Supabase "Site URL" exactly
4. ✅ Add your Vercel URL to Google Cloud Console (Authorized JavaScript origins)

The code is already set up correctly - it just needs the right configuration!
