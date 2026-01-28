# Google Cloud Console OAuth Configuration Fix

## The Error

```
Invalid Origin: cannot contain a wildcard (*).
Invalid Origin: URIs must not contain a path or end with "/".
```

## The Fix

### 1. Authorized JavaScript origins

**What to add:**
```
https://misbahdiary2.vercel.app
```

**NOT:**
- ❌ `https://misbahdiary2.vercel.app/**` (wildcards not allowed)
- ❌ `https://misbahdiary2.vercel.app/` (no trailing slash)
- ❌ `https://misbahdiary2.vercel.app/auth/callback` (no paths)

**Just the domain:**
- ✅ `https://misbahdiary2.vercel.app`

### 2. Authorized redirect URIs

**What to add:**
```
https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback
```

**Important:**
- This is the Supabase callback URL, NOT your Vercel URL
- Copy it exactly from: **Supabase Dashboard → Auth → Providers → Google**
- This is where Google redirects AFTER authentication

## Complete Configuration

### Google Cloud Console → Credentials → OAuth Client ID

**Authorized JavaScript origins:**
```
https://misbahdiary2.vercel.app
https://xsdqwbcpvdreawkyvpnk.supabase.co
```

**Authorized redirect URIs:**
```
https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback
```

## Why This Configuration?

1. **Authorized JavaScript origins** = Where the OAuth request comes FROM
   - Your Vercel app: `https://misbahdiary2.vercel.app`
   - Supabase (if needed): `https://xsdqwbcpvdreawkyvpnk.supabase.co`

2. **Authorized redirect URIs** = Where Google redirects TO after authentication
   - Supabase callback: `https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback`
   - Google redirects to Supabase, then Supabase redirects to your app

## Steps

1. Remove the invalid entry: `https://misbahdiary2.vercel.app/**`
2. Add: `https://misbahdiary2.vercel.app` (no wildcard, no path)
3. Add: `https://xsdqwbcpvdreawkyvpnk.supabase.co` (if not already there)
4. Add redirect URI: `https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback`
5. Click **Save**
6. Try Google login again
