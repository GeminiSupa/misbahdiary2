# Fix: Token Permission Denied (403 Error)

## The Problem
Your token is being denied with a 403 error. This usually means:
1. Token doesn't have `repo` scope (write permissions)
2. Token might be expired or revoked
3. Organization restrictions might be blocking it

## Solution: Create New Token with Correct Permissions

### Step 1: Create New Token

1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Fill in:
   - **Note**: "Vercel Deployment - Full Access"
   - **Expiration**: 90 days (or No expiration)
   - **Scopes**: Check these boxes:
     - ✅ **repo** (Full control of private repositories)
       - ✅ repo:status
       - ✅ repo_deployment
       - ✅ public_repo
       - ✅ repo:invite
       - ✅ security_events
     - ✅ **workflow** (Update GitHub Action workflows)
4. Click **"Generate token"**
5. **Copy the token immediately** (you won't see it again!)

### Step 2: Push with New Token

```bash
cd /Users/apple/Desktop/LawerDiary
git push -u origin main
```

When prompted:
- **Username**: `omer-Anima`
- **Password**: Paste your NEW token

### Step 3: Alternative - Use Token in URL (Temporary)

If manual entry doesn't work:

```bash
# Replace NEW_TOKEN with your new token
git remote set-url origin https://NEW_TOKEN@github.com/omer-Anima/misbahdiary1.git
git push -u origin main
```

**⚠️ Security**: After pushing, remove token from URL:
```bash
git remote set-url origin https://github.com/omer-Anima/misbahdiary1.git
```

## Verify Token Works

Test the token:
```bash
curl -H "Authorization: token YOUR_NEW_TOKEN" https://api.github.com/user
```

Should return your user info.

## After Successful Push

Once code is on GitHub:
1. Go to **https://vercel.com**
2. Import: `omer-Anima/misbahdiary1`
3. Root Directory: `web`
4. Add environment variables
5. Deploy!

