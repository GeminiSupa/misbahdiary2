# ⚠️ Deployment Error - Fix Required

## Current Status
- ✅ Project linked to Vercel
- ✅ Deployment attempted
- ❌ Build failed (likely missing environment variables)

## 🔧 Fix: Add Environment Variables

The build is failing because Supabase environment variables are missing.

### Option 1: Add via Vercel Dashboard (Easiest)

1. **Go to**: https://vercel.com/omerforce-5504s-projects/web/settings/environment-variables

2. **Click**: "Add New" for each variable:

   **Variable 1:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: Your Supabase project URL (from Supabase Dashboard → Settings → API)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: Your Supabase anon/public key
   - Environments: ✅ Production, ✅ Preview, ✅ Development

   **Variable 3:**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your Supabase service_role key
   - Environments: ✅ Production, ✅ Preview, ✅ Development

3. **After adding all 3**, go to: https://vercel.com/omerforce-5504s-projects/web
4. **Click**: "Redeploy" on the latest deployment
5. **Select**: "Use existing Build Cache" (unchecked)
6. **Click**: "Redeploy"

### Option 2: Add via CLI

```bash
cd /Users/apple/Desktop/LawerDiary/web

# Add each variable (will prompt for value)
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Also add for preview and development
npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview

# Redeploy
npx vercel --prod
```

## 📍 Get Environment Variable Values

1. Go to: **https://app.supabase.com**
2. Select your project
3. **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## ✅ After Adding Variables

1. **Redeploy** the project
2. **Wait** for build to complete (2-3 minutes)
3. **Test** your live app
4. **Update Supabase** auth URLs with your Vercel domain

## 🎯 Your Deployment URL

Once fixed, your app will be at:
**https://web-qho13f1t5-omerforce-5504s-projects.vercel.app**

Add the environment variables and redeploy! 🚀

