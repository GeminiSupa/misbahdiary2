# CRITICAL: Supabase Redirect Configuration Issue

## The Problem

**The callback route (`/auth/callback`) is NOT being hit!**

Terminal logs show:
- ❌ NO requests to `/auth/callback`
- ✅ Multiple requests to `/sign-in?redirect=%2Fauth%2Fcallback`

This means **Supabase is redirecting to the wrong URL** after Google authentication.

## Root Cause

Supabase is redirecting to your **Site URL** (`http://localhost:3000`) instead of your **redirect URL** (`http://localhost:3000/auth/callback`).

## The Fix

### Step 1: Check Supabase Dashboard → Authentication → URL Configuration

**Site URL** (must be):
```
http://localhost:3000
```

**Redirect URLs** (MUST include):
```
http://localhost:3000/**
http://localhost:3000/auth/callback
```

⚠️ **CRITICAL**: 
- Use wildcard pattern `/**` to allow all paths
- OR explicitly add `http://localhost:3000/auth/callback`
- NO trailing slashes
- Must include protocol (`http://` for localhost)

### Step 2: Verify Your Code

Your code is using:
```typescript
redirectTo: window.location.origin + "/auth/callback"
// Results in: http://localhost:3000/auth/callback
```

This is **correct**. The problem is Supabase's configuration.

### Step 3: Check Supabase Auth Logs

1. Go to: https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/logs/auth-logs
2. Look for your recent OAuth attempt
3. Check what URL Supabase is redirecting to

You'll likely see it's redirecting to `http://localhost:3000` (Site URL) instead of `http://localhost:3000/auth/callback`.

## Why This Happens

Supabase uses the **Site URL** as a fallback if:
1. The redirect URL isn't in the allowed Redirect URLs list
2. The redirect URL doesn't match the Site URL domain
3. There's a configuration mismatch

## Solution

**Add `http://localhost:3000/**` to Supabase Redirect URLs**, then try again.

After fixing, you should see in terminal:
```
GET /auth/callback?code=... 200 in XXXms
🔔 OAuth Callback received: { hasCode: true, ... }
🍪 All cookies received: { ... }
```

Instead of:
```
GET /sign-in?redirect=%2Fauth%2Fcallback 200 in XXXms
```
