# Quick Vercel Deployment Guide

## 🚀 Deploy in 3 Steps

### Step 1: Push to Git
```bash
cd /Users/apple/Desktop/LawerDiary
git init  # if not already initialized
git add .
git commit -m "Ready for Vercel deployment"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Configure:
   - **Root Directory**: `web`
   - **Framework**: Next.js (auto-detected)
5. Add Environment Variables (see below)
6. Click "Deploy"

**Option B: Via Vercel CLI**
```bash
cd web
npm install -g vercel
vercel
```
Follow the prompts and set root directory to current directory.

### Step 3: Set Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Get these from Supabase:**
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy the values

### Step 4: Update Supabase Auth URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to **Redirect URLs**:
   - `https://your-project.vercel.app/auth/callback`
   - `https://your-project.vercel.app/**`
3. Set **Site URL** to: `https://your-project.vercel.app`

### Step 5: Redeploy

After setting environment variables, redeploy:
- Vercel Dashboard → Deployments → Click "..." → Redeploy
- Or push a new commit

## ✅ That's it!

Your app should now be live at `https://your-project.vercel.app`

## 🔧 Troubleshooting

**Build fails?**
- Check environment variables are set correctly
- Verify root directory is `web`
- Check build logs in Vercel dashboard

**Auth not working?**
- Verify Supabase redirect URLs include your Vercel domain
- Check environment variables are set for Production environment

**Database errors?**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase project is active

## 📚 More Help

See [VERCEL_DEPLOYMENT.md](../VERCEL_DEPLOYMENT.md) for detailed guide.

