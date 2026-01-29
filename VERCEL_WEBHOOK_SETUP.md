# Vercel Webhook Setup Guide

## ⚠️ Important: Don't Create Webhook Manually

**Vercel creates webhooks automatically** when you connect a GitHub repository. You should **NOT** manually create a webhook in GitHub.

---

## Step 1: Check for Existing Vercel Webhook

### In GitHub:

1. Go to: [GitHub → Your Repo → Settings → Webhooks](https://github.com/GeminiSupa/misbahdiary2/settings/hooks)
2. Look for webhooks with:
   - **Payload URL**: Contains `vercel.com` or `api.vercel.com`
   - **Status**: Should show a green checkmark ✅

### What You Should See:

If Vercel is connected, you'll see something like:
```
Payload URL: https://api.vercel.com/v1/integrations/github/...
Content type: application/json
Status: ✅ Active
Recent Deliveries: [Shows recent push events]
```

---

## Step 2: If NO Vercel Webhook Exists

**This means Vercel is not properly connected to GitHub.**

### Solution: Reconnect Repository in Vercel

1. **Go to Vercel Dashboard**:
   - [Vercel Dashboard](https://vercel.com/dashboard)
   - Click on your project: **misbahdiary2**

2. **Disconnect Repository**:
   - Go to: **Settings** → **Git**
   - Scroll down
   - Click **"Disconnect"** button (if connected to wrong repo)
   - OR if it says "Not Connected", skip this step

3. **Connect Repository**:
   - Click **"Connect Git Repository"**
   - Select **GitHub**
   - Authorize Vercel (if prompted)
   - Find and select: `GeminiSupa/misbahdiary2`
   - Click **"Connect"**

4. **Configure Settings**:
   - **Root Directory**: `.` (leave as default)
   - **Framework Preset**: Next.js (should auto-detect)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `.next` (should auto-detect)
   - **Production Branch**: `main` ✅
   - **Auto-deploy**: **ON** ✅

5. **Save and Deploy**:
   - Click **"Deploy"** or **"Save"**
   - Vercel will automatically create the webhook

---

## Step 3: Verify Webhook Was Created

After reconnecting in Vercel:

1. **Go back to GitHub Webhooks**:
   - [GitHub → Your Repo → Settings → Webhooks](https://github.com/GeminiSupa/misbahdiary2/settings/hooks)
   - You should now see a new webhook with `vercel.com` in the URL

2. **Check Recent Deliveries**:
   - Click on the webhook
   - Go to **"Recent Deliveries"** tab
   - You should see recent push events
   - Status should be **200 OK** (green) ✅

---

## Step 4: Test Auto-Deploy

1. **Make a small change**:
   ```bash
   # Add a comment to any file
   # Or just touch a file
   ```

2. **Commit and push**:
   ```bash
   git add .
   git commit -m "Test auto-deploy after webhook setup"
   git push origin main
   ```

3. **Check Vercel**:
   - Go to Vercel → Your Project → **Deployments**
   - Within 10-30 seconds, a new deployment should start automatically
   - The deployment should show your latest commit hash

---

## Troubleshooting

### If Webhook Shows Errors (Red X):

1. **Check Recent Deliveries**:
   - Click on the webhook
   - Look at **"Recent Deliveries"**
   - Click on a failed delivery
   - Check the **Response** tab for error message

2. **Common Errors**:
   - **401 Unauthorized**: Vercel token expired → Reconnect repository
   - **404 Not Found**: Wrong webhook URL → Reconnect repository
   - **500 Server Error**: Vercel issue → Wait and retry

### If Auto-Deploy Still Doesn't Work:

1. **Verify Production Branch**:
   - Vercel → Settings → Git
   - Production Branch = `main`
   - Auto-deploy = **ON**

2. **Check Branch Protection**:
   - GitHub → Your Repo → Settings → Branches
   - Make sure `main` branch is not protected in a way that blocks webhooks

3. **Manual Deploy First**:
   - Deploy latest commit manually
   - Then test auto-deploy with next commit

---

## Summary

✅ **DO**: Let Vercel create the webhook automatically (by connecting repository)  
❌ **DON'T**: Manually create a webhook in GitHub

**Steps:**
1. Check if Vercel webhook exists in GitHub
2. If not → Reconnect repository in Vercel
3. Verify webhook appears in GitHub
4. Test auto-deploy with a new commit

---

## Quick Checklist

- [ ] Checked GitHub webhooks page
- [ ] Found Vercel webhook (or it's missing)
- [ ] Reconnected repository in Vercel (if webhook missing)
- [ ] Verified webhook shows in GitHub
- [ ] Tested auto-deploy with new commit
- [ ] Confirmed new deployment starts automatically
