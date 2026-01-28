# Google OAuth Quick Fix Guide

## ⚠️ IMPORTANT: Console Warnings Are NOT The Problem

**These warnings are normal and can be ignored:**
- ❌ "Self-XSS" warning → Normal Chrome DevTools warning
- ❌ "aria-hidden" warning → Google's account chooser UI issue
- ❌ "Chrome bounce tracking" → Informational only

**✅ The REAL errors are in Supabase Auth Logs!**

---

## 🔍 Step 1: Check Supabase Auth Logs

**This is where you'll find the actual problem:**

1. Go to: [Supabase Dashboard → Auth → Logs](https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/logs/auth-logs)
2. Look for your recent OAuth attempt
3. Check the error message - it will tell you exactly what's wrong

**Common errors you'll see:**
- `redirect_uri_mismatch` → 95% of cases - URL configuration issue
- `invalid_client` → Google OAuth not configured in Supabase
- `access_denied` → User denied or consent screen issue
- `PKCE code verifier not found` → Cookie issue

---

## ✅ Step 2: Fix Redirect URL Mismatch (Most Common)

### Supabase Dashboard → Authentication → URL Configuration

**Site URL** (must match exactly, no trailing slash):
```
https://your-vercel-app.vercel.app
```

**Redirect URLs** (use wildcard pattern):
```
https://your-vercel-app.vercel.app/**
```

### Google Cloud Console → Credentials → OAuth Client ID

**Authorized redirect URI** (copy from Supabase):
```
https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback
```

**How to get this URL:**
1. Go to Supabase → Auth → Providers → Google
2. Copy the callback URL shown there
3. Paste it exactly in Google Cloud Console

---

## ✅ Step 3: Verify Google OAuth Configuration

### Google Cloud Console → OAuth Consent Screen
- ✅ App status: `Testing` or `Published`
- ✅ User type: `External` → add your email as **Test User**
- ✅ Scopes: `email`, `profile`, `openid`

### Supabase → Auth → Providers → Google
- ✅ Enabled: Toggle ON
- ✅ Client ID: Pasted from Google
- ✅ Client Secret: Pasted from Google
- ✅ **Save button clicked** (people forget this!)

---

## ✅ Step 4: Verify Environment Variables

In Vercel, ensure these match Supabase Site URL exactly:

```env
NEXT_PUBLIC_SITE_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://xsdqwbcpvdreawkyvpnk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

⚠️ **Critical**: `NEXT_PUBLIC_SITE_URL` must match Supabase Site URL character-for-character!

---

## 🧪 Testing Checklist

1. ✅ Check Supabase Auth Logs for actual errors (not browser console)
2. ✅ Verify redirect URLs match exactly (no trailing slashes)
3. ✅ Verify Google OAuth is enabled and saved in Supabase
4. ✅ Verify environment variables match Supabase Site URL
5. ✅ Test in incognito window (clear cache/cookies)
6. ✅ Check if login actually works (warnings may be false alarms)

---

## 📚 Full Documentation

See `OAUTH_TROUBLESHOOTING.md` for complete troubleshooting guide.

---

## 🆘 Still Not Working?

1. **Check Supabase Auth Logs** - This is the #1 place to find the real error
2. **Compare URLs character-by-character** - One typo breaks everything
3. **Verify all checkboxes are saved** - Especially in Supabase Google provider settings
4. **Test in different browser** - To rule out browser-specific issues
