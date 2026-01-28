# How to Check Supabase Auth Logs

## 🔍 Step 1: Access Supabase Auth Logs

1. **Go to your Supabase Dashboard:**
   - Direct link: https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/logs/auth-logs
   - Or navigate: Dashboard → Your Project → Authentication → Logs

2. **Look for your recent OAuth attempt:**
   - The logs show all authentication attempts
   - Look for entries with:
     - `provider: google`
     - Recent timestamp (last few minutes)
     - Status code (200 = success, 4xx/5xx = error)

## 📊 Step 2: What to Look For

### ✅ Success Indicators:
- **Status**: `200` or `302`
- **Error Code**: `null` or empty
- **Message**: Shows successful authentication

### ❌ Error Indicators:
- **Status**: `400`, `401`, `403`, `500`, etc.
- **Error Code**: Specific error code (see below)
- **Message**: Error description

## 🚨 Common Error Codes and What They Mean

### 1. `redirect_uri_mismatch` (Most Common - 95% of cases)
**What it means:** The redirect URL in your request doesn't match what's configured in Google Cloud Console.

**How to fix:**
1. Go to **Google Cloud Console → Credentials → OAuth Client ID**
2. Check **Authorized redirect URIs**
3. Make sure this EXACT URL is listed:
   ```
   https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback
   ```
4. Copy this URL from: **Supabase Dashboard → Auth → Providers → Google** (it's shown there)

### 2. `invalid_client`
**What it means:** Google OAuth is not properly configured in Supabase.

**How to fix:**
1. Go to **Supabase Dashboard → Auth → Providers → Google**
2. Verify:
   - ✅ Enabled: ON
   - ✅ Client ID: Set (from Google Cloud Console)
   - ✅ Client Secret: Set (from Google Cloud Console)
   - ✅ **Save button clicked** (people forget this!)

### 3. `access_denied`
**What it means:** User denied access OR consent screen not configured properly.

**How to fix:**
1. Go to **Google Cloud Console → OAuth Consent Screen**
2. Verify:
   - App status: `Testing` or `Published`
   - User type: `External`
   - Your email is added as **Test User** (if Testing mode)
   - Scopes include: `email`, `profile`, `openid`

### 4. `PKCE code verifier not found`
**What it means:** Cookie/storage issue - the OAuth flow was interrupted.

**How to fix:**
- Clear browser cookies and try again
- Make sure you're not using incognito/private mode
- Check if cookies are being blocked by browser settings

### 5. `invalid_grant`
**What it means:** The authorization code has expired or was already used.

**How to fix:**
- Try logging in again (get a fresh code)
- This usually happens if you refresh the page during OAuth flow

## 📋 Step 3: Check the Log Details

When you click on a log entry, you'll see:

### Request Details:
- **URL**: The full callback URL
- **Method**: GET
- **Headers**: Request headers
- **Query Parameters**: `code`, `state`, `error`, etc.

### Response Details:
- **Status Code**: HTTP status
- **Error Code**: Supabase error code (if any)
- **Message**: Error message
- **Metadata**: Additional debugging info

### State Parameter:
The `state` parameter contains:
- `site_url`: Your app's URL
- `referer`: Where to redirect after auth
- `provider`: `google`
- `flow_state_id`: Unique flow identifier

## 🔧 Step 4: Use the Diagnostics Page

I've created a diagnostics page that checks your configuration:

1. **Visit:** http://localhost:3000/diagnostics (or your production URL)
2. **Check each section:**
   - Environment variables
   - Calculated URLs
   - OAuth URL generation test
   - Current auth state
   - Configuration checklist

This will help identify configuration issues before checking logs.

## 📝 Step 5: Enhanced Logging

I've also enhanced the logging in your callback route. Check your **Next.js server logs** (terminal where you run `npm run dev`) for:

- `🔔 OAuth Callback received:` - Callback was hit
- `✅ OAuth callback successful!` - Session created
- `❌ Error exchanging code for session:` - Error details
- `🍪 Cookies set in response:` - Cookie information

## 🎯 Quick Checklist

Before checking logs, verify:

- [ ] **Supabase Dashboard → Auth → URL Configuration:**
  - Site URL matches your app URL exactly
  - Redirect URLs includes `your-url/**`

- [ ] **Google Cloud Console → Credentials:**
  - Authorized redirect URI: `https://xsdqwbcpvdreawkyvpnk.supabase.co/auth/v1/callback`

- [ ] **Supabase Dashboard → Auth → Providers → Google:**
  - Enabled: ON
  - Client ID: Set
  - Client Secret: Set
  - Saved

## 💡 Pro Tip

**The most important thing:** The error message in Supabase Auth Logs will tell you EXACTLY what's wrong. Look for the `error_code` and `message` fields - they're your best friend for debugging!

## 🔗 Direct Links

- **Supabase Auth Logs:** https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/logs/auth-logs
- **Supabase URL Config:** https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/auth/url-configuration
- **Supabase Google Provider:** https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/auth/providers
