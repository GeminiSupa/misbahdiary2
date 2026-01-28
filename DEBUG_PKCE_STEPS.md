# Debug PKCE Issue - Step by Step

## Current Status
- ✅ OAuth login succeeds on Supabase side
- ❌ PKCE code verifier not found in callback
- ❌ User redirected back to sign-in with error

## What We Need to Check

### Step 1: Check Browser Console (Before Redirect)

When you click "Sign in with Google", look in the browser console for:

```
✅ OAuth URL generated, redirecting: https://...
🔐 PKCE code verifier will be stored in cookies automatically
🍪 Code verifier cookie check: {
  cookieName: "sb-xsdqwbcpvdreawkyvpnk-auth-token-code-verifier",
  hasCookie: true/false,
  cookieValue: "...",
  allCookieNames: [...]
}
```

**What to look for:**
- If `hasCookie: false` → Cookie isn't being set (this is the problem!)
- If `hasCookie: true` → Cookie is set, but might be lost during redirect

### Step 2: Check Next.js Server Logs (After Callback)

After Google redirects back, check your terminal (where `npm run dev` is running) for:

```
🔔 OAuth Callback received: { hasCode: true, ... }
🍪 All cookies received: {
  cookieCount: X,
  cookieNames: [...],
  hasAuthCookie: true/false,
  hasCodeVerifier: true/false
}
🔐 PKCE Code Verifier Check: {
  projectRef: "xsdqwbcpvdreawkyvpnk",
  codeVerifierCookieName: "sb-xsdqwbcpvdreawkyvpnk-auth-token-code-verifier",
  hasCodeVerifier: true/false
}
```

**What to look for:**
- If `hasCodeVerifier: false` → Cookie wasn't sent with the callback request
- If `hasCodeVerifier: true` but still getting PKCE error → Different issue

### Step 3: Check Browser Cookies (Manually)

1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Cookies** → `http://localhost:3000`
4. Look for cookie: `sb-xsdqwbcpvdreawkyvpnk-auth-token-code-verifier`

**What to check:**
- Does the cookie exist?
- What are its attributes? (Domain, Path, SameSite, Secure, HttpOnly)
- Is it set before redirect to Google?

## Common Issues and Solutions

### Issue 1: Cookie Not Set Before Redirect

**Symptoms:**
- Browser console shows `hasCookie: false`
- Cookie doesn't exist in Application tab

**Possible Causes:**
- `createBrowserClient` not working correctly
- Cookie being blocked by browser
- Cookie domain/path mismatch

**Solution:**
- Check if `createBrowserClient` is being used correctly
- Verify browser allows cookies
- Check cookie domain matches `localhost:3000`

### Issue 2: Cookie Lost During Redirect

**Symptoms:**
- Browser console shows `hasCookie: true`
- Server logs show `hasCodeVerifier: false`
- Cookie exists before redirect but not after

**Possible Causes:**
- Cookie attributes (SameSite, Secure) blocking cross-site redirect
- Cookie domain mismatch
- Cookie expired during redirect

**Solution:**
- Check cookie `SameSite` attribute (should be `Lax` or `None`)
- For localhost, `Secure` should be `false`
- Verify cookie domain is exactly `localhost` (no port in domain)

### Issue 3: Cookie Not Sent with Callback Request

**Symptoms:**
- Cookie exists in browser
- Server logs show no cookies received
- `cookieCount: 0` in logs

**Possible Causes:**
- Cookie path mismatch
- Cookie domain mismatch
- Cookie SameSite policy blocking

**Solution:**
- Verify cookie path is `/` (root)
- Verify cookie domain matches request domain
- Check SameSite policy allows cross-site requests

## Next Steps

1. **Try logging in again** and capture:
   - Browser console output (especially cookie check)
   - Next.js server logs (especially callback cookie logs)
   - Screenshot of Application → Cookies tab

2. **Share the logs** so we can identify exactly where the cookie is being lost

3. **If cookie is set but not received**, we'll need to adjust cookie attributes

## Quick Test

Run this in browser console after clicking "Sign in with Google" (before redirect):

```javascript
const projectRef = "xsdqwbcpvdreawkyvpnk";
const cookieName = `sb-${projectRef}-auth-token-code-verifier`;
const hasCookie = document.cookie.includes(cookieName);
console.log("PKCE Cookie Check:", {
  cookieName,
  hasCookie,
  allCookies: document.cookie.split(";").map(c => c.trim().split("=")[0])
});
```

This will tell us if the cookie is being set.
