# Supabase 500 Error Fix - "Unexpected failure"

## The Error

```
{"code":500,"error_code":"unexpected_failure","msg":"Unexpected failure, please check server logs for more information"}
```

This is a **server-side error from Supabase**, not your code. It means Supabase couldn't process the OAuth request.

## Common Causes

### 1. Google OAuth Not Enabled in Supabase (MOST COMMON)

**Fix:**
1. Go to: [Supabase Dashboard → Auth → Providers → Google](https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/auth/providers)
2. Check if **"Enabled"** toggle is **ON**
3. If it's OFF, turn it ON and **Save**

### 2. Missing Google Client ID or Secret

**Fix:**
1. Go to: [Supabase Dashboard → Auth → Providers → Google](https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/auth/providers)
2. Check if **Client ID** and **Client Secret** are filled in
3. If empty:
   - Get them from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Paste them into Supabase
   - Click **Save**

### 3. Invalid Google Credentials

**Fix:**
1. Verify your Google Client ID and Secret are correct
2. Make sure they're from the same Google Cloud project
3. Check if the OAuth consent screen is configured

### 4. Supabase Service Issue

**Fix:**
1. Check [Supabase Status Page](https://status.supabase.com/)
2. Try again in a few minutes

## How to Check Supabase Logs

1. Go to: [Supabase Dashboard → Logs → Auth Logs](https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/logs/auth-logs)
2. Look for your recent OAuth attempt
3. Check the error message - it will tell you exactly what's wrong

## Quick Checklist

- [ ] Google OAuth is **Enabled** in Supabase
- [ ] **Client ID** is filled in
- [ ] **Client Secret** is filled in
- [ ] Clicked **Save** button in Supabase
- [ ] Google Cloud Console has correct redirect URI: `https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback`
- [ ] OAuth consent screen is configured in Google Cloud Console

## Most Likely Fix

**90% of the time, this error means Google OAuth is not enabled in Supabase.**

Go to Supabase Dashboard → Auth → Providers → Google and make sure:
1. ✅ **Enabled** toggle is ON
2. ✅ **Client ID** is filled
3. ✅ **Client Secret** is filled
4. ✅ Clicked **Save**

Then try again!
