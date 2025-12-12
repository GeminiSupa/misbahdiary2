# 🚀 Deploy to Vercel - Step by Step

## ✅ Your Code is Ready!
- Repository: https://github.com/omer-Anima/misbahdiary1
- All files committed and pushed
- Vercel configuration ready

## 🎯 Deploy via Vercel Dashboard (Recommended)

### Step 1: Go to Vercel
Visit: **https://vercel.com** and sign in with GitHub

### Step 2: Import Project
1. Click **"Add New Project"** or **"New Project"**
2. You'll see your GitHub repositories
3. Find and click **`omer-Anima/misbahdiary1`**
4. Click **"Import"**

### Step 3: Configure Project
1. **Root Directory**: 
   - Click **"Edit"** next to Root Directory
   - Change from `/` to **`web`**
   - Click **"Continue"**

2. **Framework Preset**: 
   - Should auto-detect as **Next.js**
   - If not, select **Next.js**

3. **Build Settings** (should auto-fill):
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Step 4: Add Environment Variables
**Before clicking Deploy**, click **"Environment Variables"** and add:

```
NEXT_PUBLIC_SUPABASE_URL
```
Value: Your Supabase project URL (from Supabase Dashboard → Settings → API)

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Value: Your Supabase anon/public key

```
SUPABASE_SERVICE_ROLE_KEY
```
Value: Your Supabase service_role key (keep secret!)

**Get these from**: https://app.supabase.com → Your Project → Settings → API

### Step 5: Deploy!
1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. Your app will be live at: `https://misbahdiary1.vercel.app` (or similar)

## 🔧 After Deployment

### Update Supabase Auth URLs
1. Go to: **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   https://your-project.vercel.app/auth/callback
   ```
3. Set **Site URL** to:
   ```
   https://your-project.vercel.app
   ```
4. Click **Save**

## 🎉 You're Live!

Your Lawyer Diary app is now deployed and accessible worldwide!

## 📝 Quick Reference

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your Repository**: https://github.com/omer-Anima/misbahdiary1
- **Vercel Docs**: https://vercel.com/docs

