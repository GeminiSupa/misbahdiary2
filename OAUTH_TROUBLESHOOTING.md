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

### 1. Supabase Dashboard Settings
Go to: **Authentication → URL Configuration**

**Site URL**: 
- Production: `https://your-vercel-app.vercel.app`
- Local: `http://localhost:3000`

**Redirect URLs** (add all of these):
- `https://your-vercel-app.vercel.app/auth/callback`
- `https://your-vercel-app.vercel.app/auth/redirect`
- `https://your-vercel-app.vercel.app/**`
- `http://localhost:3000/auth/callback` (for local dev)
- `http://localhost:3000/auth/redirect` (for local dev)

### 2. Google Cloud Console Settings
Go to: **APIs & Services → Credentials → OAuth 2.0 Client ID**

**Authorized redirect URIs** (add):
- `https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback`

**Authorized JavaScript origins**:
- `https://xsdqwbcpvdreawkyvpnk.supabase.co`

### 3. Environment Variables
Ensure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (should be your Vercel URL)
- `SUPABASE_SERVICE_ROLE_KEY`

## Debugging Steps

### 1. Check Browser Console
- Open Developer Tools (F12)
- Go to Console tab
- Look for messages starting with:
  - ✅ = Success
  - ⚠️ = Warning
  - ❌ = Error
  - 🔄 = Retry attempt
  - 🔔 = Callback received
  - 🍪 = Cookie information

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

## Common Issues

### Issue: "PKCE code verifier not found"
**Solution**: The code verifier is stored in cookies. Ensure:
- Cookies are enabled in browser
- SameSite cookie policy allows cross-site cookies
- Secure cookies are used (HTTPS)

### Issue: "Chrome bounce tracking mitigation"
**Solution**: This is often just a warning. Test if login actually works:
- The warning may be informational only
- Check if you're actually logged in after the flow
- Check network tab to see if requests succeed

### Issue: "Redirect URI mismatch"
**Solution**: Ensure redirect URLs match exactly:
- Check Supabase dashboard redirect URLs
- Check Google Cloud Console redirect URIs
- Ensure no trailing slashes or mismatches

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
