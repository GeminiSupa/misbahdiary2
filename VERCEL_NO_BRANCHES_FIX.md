# Fix "No Active Branches" in Vercel

## Problem
Vercel shows "No Active Branches" even though your GitHub repo has commits.

## Solution: Reconnect Repository

### Step 1: Disconnect Current Connection

1. Go to: **Settings** → **Git**
2. Find the section showing `GeminiSupa/misbahdiary2`
3. Click **"Disconnect"** or **"..."** → **Disconnect**
4. Confirm disconnection

### Step 2: Reconnect Repository

1. After disconnecting, you'll see **"Connect Git Repository"** button
2. Click **"Connect Git Repository"**
3. Select **GitHub**
4. You may need to authorize Vercel to access your GitHub (if not already done)
5. Find and select: **`GeminiSupa/misbahdiary2`**
6. Click **Connect**

### Step 3: Configure Project Settings

After connecting, Vercel will show configuration:

**Root Directory**: `.` (leave as default, unless your Next.js app is in a subfolder)

**Framework Preset**: Should auto-detect as **Next.js**

**Build Command**: `npm run build` (should auto-detect)

**Output Directory**: `.next` (should auto-detect)

**Install Command**: `npm install` (should auto-detect)

**Node.js Version**: Leave as default or select latest LTS

### Step 4: Set Production Branch

**IMPORTANT**: After connecting, make sure:

1. **Production Branch**: Set to `main`
2. **Auto-deploy**: Toggle **ON**

### Step 5: Deploy

1. Click **"Deploy"** button
2. Vercel will:
   - Clone your repository
   - Detect branches (should show `main`)
   - Start building
   - Deploy

### Step 6: Verify Branches Appear

After deployment completes:

1. Go to: **Settings** → **Git**
2. You should now see:
   - ✅ **Active Branches**: `main` (or list of branches)
   - ✅ **Production Branch**: `main`
   - ✅ **Auto-deploy**: ON

---

## Alternative: Check GitHub Permissions

If reconnecting doesn't work, check GitHub permissions:

1. Go to: [GitHub → Settings → Applications → Authorized OAuth Apps](https://github.com/settings/applications)
2. Find **Vercel**
3. Make sure it has access to:
   - ✅ **Repository access**: `GeminiSupa/misbahdiary2`
   - ✅ **Read repository contents**
   - ✅ **Read repository metadata**

If Vercel isn't listed or has wrong permissions:
- Reconnect in Vercel (it will ask for GitHub authorization)
- Grant access to your repositories

---

## Why This Happens

"No Active Branches" usually means:
- Repository connection is incomplete
- Vercel can't read the repository
- GitHub permissions are missing
- Repository was connected but connection broke

**Reconnecting fixes this 99% of the time.**

---

## After Reconnecting

Once branches appear:
- ✅ Future commits to `main` will auto-deploy
- ✅ You'll see all branches in Settings → Git
- ✅ Deployments will trigger automatically
