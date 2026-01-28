# Fix Vercel Auto-Deploy - Use Latest Commits

## Problem
Vercel is deploying an old commit instead of automatically deploying new commits from GitHub.

## Solution: Reconnect Vercel to GitHub

### Step 1: Check Current Vercel Project Settings

1. Go to: [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project: **misbahdiary2** (or your project name)
3. Go to **Settings** → **Git**

### Step 2: Verify GitHub Connection

**Check if you see:**
- ✅ **Connected Repository**: Should show `GeminiSupa/misbahdiary2`
- ✅ **Production Branch**: Should be `main` (or `master`)
- ✅ **Auto-deploy**: Should be **ON**

**If you see "Not Connected" or wrong repo:**
→ Go to Step 3

**If connected but still not deploying:**
→ Go to Step 4

---

### Step 3: Connect/Reconnect GitHub Repository

**Option A: Reconnect Existing Project**

1. In Vercel → Your Project → **Settings** → **Git**
2. Click **Disconnect** (if connected to wrong repo)
3. Click **Connect Git Repository**
4. Select **GitHub**
5. Find and select: `GeminiSupa/misbahdiary2`
6. Click **Connect**
7. Configure:
   - **Root Directory**: Leave as `.` (or set if your Next.js app is in a subfolder)
   - **Framework Preset**: Next.js (should auto-detect)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `.next` (should auto-detect)
8. Click **Deploy**

**Option B: Create New Project (if reconnect fails)**

1. Go to: [Vercel Dashboard → Add New Project](https://vercel.com/new)
2. Import from GitHub: `GeminiSupa/misbahdiary2`
3. Configure settings (same as above)
4. Click **Deploy**
5. **Important**: Update your domain/environment variables in the new project

---

### Step 4: Enable Auto-Deploy

1. Go to: **Settings** → **Git**
2. Under **Production Branch**:
   - **Branch**: `main` (or `master` if that's your default)
   - ✅ **Auto-deploy**: Make sure this is **ON**
3. Under **Preview Deployments**:
   - ✅ **Automatic Preview Deployments**: Should be **ON**
   - **Pull Request Comments**: Optional (recommended: ON)

---

### Step 5: Verify GitHub Webhook

**Vercel needs a webhook to know when you push:**

1. Go to: [GitHub → Your Repo → Settings → Webhooks](https://github.com/GeminiSupa/misbahdiary2/settings/hooks)
2. Look for a webhook pointing to `vercel.com` or `vercel.app`
3. **If missing:**
   - Vercel should create this automatically when you connect
   - If not, you may need to reconnect (Step 3)

---

### Step 6: Test Auto-Deploy

1. Make a small change (add a comment to any file)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test auto-deploy"
   git push origin main
   ```
3. Go to: [Vercel Dashboard → Your Project → Deployments](https://vercel.com/dashboard)
4. **You should see a new deployment start automatically** within 10-30 seconds

---

### Step 7: Manual Deploy (If Auto-Deploy Still Fails)

**As a temporary workaround:**

1. Go to: [Vercel Dashboard → Your Project](https://vercel.com/dashboard)
2. Click **Deployments** tab
3. Click **...** (three dots) on the latest deployment
4. Click **Redeploy**
5. Or click **Create Deployment** → Select branch `main` → **Deploy**

---

## Common Issues

### Issue 1: "Deployment not found" or 404
**Fix**: Your Vercel project might be disconnected. Reconnect using Step 3.

### Issue 2: Wrong branch deploying
**Fix**: 
- Go to **Settings** → **Git**
- Change **Production Branch** to `main` (or your actual default branch)
- Save

### Issue 3: Build fails
**Fix**: Check build logs in Vercel → Deployments → Click failed deployment → View logs

### Issue 4: Environment variables missing
**Fix**: 
- Go to **Settings** → **Environment Variables**
- Add all required variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

---

## Quick Checklist

- [ ] Vercel project connected to `GeminiSupa/misbahdiary2` GitHub repo
- [ ] Production branch set to `main`
- [ ] Auto-deploy enabled
- [ ] GitHub webhook exists (check GitHub repo settings)
- [ ] Environment variables configured
- [ ] Tested by pushing a commit

---

## Still Not Working?

**Check Vercel logs:**
1. Go to: Vercel Dashboard → Your Project → **Deployments**
2. Click on a deployment
3. Check **Build Logs** and **Function Logs** for errors

**Check GitHub:**
1. Go to: GitHub → Your Repo → **Settings** → **Webhooks**
2. Verify webhook exists and shows recent deliveries
3. If webhook shows errors, reconnect Vercel project

**Contact Vercel Support:**
- If nothing works, contact Vercel support with your project URL and GitHub repo URL
