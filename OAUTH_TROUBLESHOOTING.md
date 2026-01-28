# Google OAuth Troubleshooting Guide

## Current Implementation Approaches

We've implemented multiple fallback approaches to handle Chrome's bounce tracking mitigation:

### 1. Server-Side OAuth Initiation
- **File**: `app/(auth)/sign-in/actions.ts`
- Server action that generates OAuth URL server-side
- Bypasses client-side browser restrictions
- **Status**: Primary approach

### 2. Client-Side OAuth (Multiple Variations)
- **File**: `components/auth/sign-in-form.tsx`
- Tries OAuth without queryParams first
- Falls back to OAuth with queryParams
- Falls back to alternative redirect page
- **Status**: Fallback approaches

### 3. Alternative Redirect Page
- **File**: `app/auth/redirect/page.tsx`
- Server-side page component that handles OAuth callback
- May help with cookie persistence
- **Status**: Alternative callback handler

### 4. Enhanced Cookie Handling
- **File**: `app/auth/callback/route.ts`
- Explicit cookie copying and setting
- Proper cookie attributes (httpOnly, secure, sameSite)
- Cache control headers
- **Status**: Improved cookie persistence

## Supabase Configuration Checklist

### ⚠️ CRITICAL: Redirect URL Configuration

**This is the #1 cause of OAuth failures (95% of cases)**

### 1. Supabase Dashboard Settings
Go to: **Authentication → URL Configuration**

**Site URL**: 
- Production: `https://your-vercel-app.vercel.app` (must match exactly, no trailing slash)
- Local: `http://localhost:3000` (must match exactly, no trailing slash)

**Redirect URLs** (add these - must match character-for-character):
- `https://your-vercel-app.vercel.app/**` (wildcard for all paths)
- `http://localhost:3000/**` (for local dev)

⚠️ **IMPORTANT**: 
- Use wildcard `/**` pattern (Supabase recommended)
- No extra slashes
- Must include protocol (`https://` or `http://`)
- Must match your `NEXT_PUBLIC_SITE_URL` environment variable exactly

### 2. Google Cloud Console Settings

#### OAuth Consent Screen
- **App status**: `Testing` or `Published`
- **User type**: `External` → add your email as **Test User**
- **Scopes**: Must include `email`, `profile`, `openid`

#### Credentials → OAuth Client ID

**Authorized JavaScript origins** (add):
- `https://xsdqwbcpvdreawkyvpnk.supabase.co` (your Supabase project URL)

**Authorized redirect URIs** (add - THIS IS CRITICAL):
- `https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback`

⚠️ **IMPORTANT**: 
- This URL comes from **Supabase → Auth → Providers → Google**
- Copy it exactly from Supabase dashboard
- Must match character-for-character
- This is the URL Google redirects to after authentication

### 3. Supabase Google Provider Configuration
Go to: **Supabase → Auth → Providers → Google**

- ✅ **Enabled**: Toggle must be ON
- ✅ **Client ID**: Paste from Google Cloud Console
- ✅ **Client Secret**: Paste from Google Cloud Console
- ✅ **Save**: Click the Save button (people forget this! 😅)

### 4. Environment Variables
Ensure these are set in Vercel (and match Supabase Site URL exactly):
- `NEXT_PUBLIC_SUPABASE_URL` = `https://xsdqwbcpvdreawkyvpnk.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your anon key
- `NEXT_PUBLIC_SITE_URL` = `https://your-vercel-app.vercel.app` (must match Supabase Site URL)
- `SUPABASE_SERVICE_ROLE_KEY` = Your service role key

## Debugging Steps

### 🔍 Step 1: Check Supabase Auth Logs (MOST IMPORTANT)

**This is where the REAL errors are!**

1. Go to: [Supabase Dashboard → Auth → Logs](https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/logs/auth-logs)
2. Look for recent OAuth attempts
3. Check the error message - it will tell you exactly what's wrong:
   - `redirect_uri_mismatch` → URL configuration issue
   - `invalid_client` → Google OAuth not configured
   - `access_denied` → User denied or consent screen issue
   - `PKCE code verifier not found` → Cookie issue

### 2. Check Browser Console (Secondary)
- Open Developer Tools (F12)
- Go to Console tab
- Look for messages starting with:
  - ✅ = Success
  - ⚠️ = Warning (usually not blocking)
  - ❌ = Error
  - 🔄 = Retry attempt
  - 🔔 = Callback received
  - 🍪 = Cookie information

⚠️ **Note**: Browser console warnings (Self-XSS, aria-hidden) are NOT the problem. Check Supabase logs instead.

### 2. Check Network Tab
- Open Developer Tools → Network tab
- Click "Sign in with Google"
- Look for:
  - Request to Supabase OAuth endpoint
  - Redirect to Google
  - Callback request to `/auth/callback`
  - Check status codes (should be 302 redirects)

### 3. Check Application Tab (Cookies)
- Open Developer Tools → Application tab → Cookies
- After OAuth flow, check if these cookies exist:
  - `sb-*-auth-token`
  - `sb-*-auth-token-code-verifier`
  - Any other Supabase auth cookies

### 4. Check Server Logs
- In Vercel dashboard, check function logs
- Look for console.log messages from callback handler
- Check for any errors in the logs

## Testing Checklist

- [ ] Test in Chrome (where warnings appear)
- [ ] Test in Firefox (to see if it's Chrome-specific)
- [ ] Test in Safari (to see if it's browser-specific)
- [ ] Test in incognito/private window
- [ ] Clear all cookies and cache, then test
- [ ] Test on localhost vs production
- [ ] Check if login actually works despite warnings

## Common Issues & Solutions

### ❌ Issue #1: "redirect_uri_mismatch" (MOST COMMON - 95% of cases)

**Error in Supabase Logs**: `redirect_uri_mismatch`

**Solution**:
1. **Supabase Dashboard** → Auth → URL Configuration
   - Site URL must match `NEXT_PUBLIC_SITE_URL` exactly
   - Redirect URLs must include `/**` wildcard pattern
   - No trailing slashes

2. **Google Cloud Console** → Credentials → OAuth Client ID
   - Authorized redirect URI must be: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Copy this URL from Supabase → Auth → Providers → Google

3. **Check Supabase Auth Logs**:
   - Go to: Supabase Dashboard → Auth → Logs
   - Look for the exact error message
   - The log will show what URL was expected vs what was received

### ❌ Issue #2: "PKCE code verifier not found"

**Solution**: The code verifier is stored in cookies. Ensure:
- Cookies are enabled in browser
- SameSite cookie policy allows cross-site cookies
- Secure cookies are used (HTTPS)
- Using `@supabase/ssr` package (we are ✅)

### ❌ Issue #3: "invalid_client"

**Solution**: 
- Google OAuth Client ID/Secret not configured in Supabase
- Go to: Supabase → Auth → Providers → Google
- Ensure Client ID and Client Secret are pasted correctly
- Click **Save** button

### ❌ Issue #4: "access_denied"

**Solution**:
- User denied Google OAuth permission
- OAuth Consent Screen not configured
- Test user not added (if app is in Testing mode)
- Go to: Google Cloud Console → OAuth Consent Screen → Add test users

### ⚠️ Issue #5: Console Warnings (NOT REAL ERRORS)

**These are NOT blocking login**:
- "Self-XSS" warning → Normal Chrome DevTools warning, ignore it
- "aria-hidden" warning → Google's account chooser UI issue, ignore it
- "Chrome bounce tracking" → Informational only, test if login actually works

**How to verify**: Check Supabase Auth Logs for actual errors, not browser console warnings

### Issue: "Blocked aria-hidden on an element accountchooser"
**Solution**: This is a **known accessibility warning from Google's account chooser UI**, not our code.
- **Status**: This warning is automatically suppressed in our implementation
- **Impact**: None - this doesn't affect OAuth functionality
- **Source**: Google's OAuth account chooser interface
- **Action**: No action needed - the warning is filtered out in the console
- **Note**: This is a Google-side issue that they should fix in their UI

## Known Warnings (Non-Critical)

### Google OAuth Account Chooser Accessibility Warning
**Warning Message**: `"Blocked aria-hidden on an element accountchooser..."`
- **Source**: Google's OAuth account chooser interface
- **Impact**: None - purely informational, doesn't affect functionality
- **Status**: Automatically suppressed in console
- **Why**: Google's account chooser has an accessibility issue where `aria-hidden` is set on an element that contains a focused element
- **Our Action**: We filter these warnings from the console to reduce noise

## Next Steps if Still Blocked

1. **Verify it's actually blocking**: Test if login completes despite warnings
2. **Check Supabase logs**: Look for errors in Supabase dashboard
3. **Try different browser**: Test in Firefox/Safari to isolate Chrome issue
4. **Contact Supabase support**: May be a Supabase configuration issue
5. **Consider alternative**: Use email/password or magic link as primary auth method
