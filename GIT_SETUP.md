# Git Repository Setup Instructions

## Current Status

Your repository is configured to push to: `https://github.com/GeminiSupa/misbahdiary.git`

## If Repository Doesn't Exist Yet

If you get "Repository not found" error, you need to create it on GitHub first:

1. Go to https://github.com/new
2. Repository name: `misbahdiary`
3. Owner: `GeminiSupa`
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have files)
6. Click "Create repository"

## Push Your Code

After creating the repository on GitHub, run:

```bash
cd /Users/apple/Desktop/LawerDiary
git add .
git commit -m "Initial commit: Lawyer Diary app ready for Vercel deployment"
git push -u origin main
```

## If You Need to Authenticate

If you get authentication errors:

**Option 1: Use Personal Access Token**
```bash
# GitHub will prompt for username and password
# Use your GitHub username
# For password, use a Personal Access Token (not your GitHub password)
# Create token at: https://github.com/settings/tokens
```

**Option 2: Use SSH (Recommended)**
```bash
# Change remote to SSH
git remote set-url origin git@github.com:GeminiSupa/misbahdiary.git

# Make sure you have SSH key set up
# Then push
git push -u origin main
```

## After Pushing to GitHub

Once your code is on GitHub, you can deploy to Vercel:

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import from GitHub: `GeminiSupa/misbahdiary`
4. Set **Root Directory** to: `web`
5. Add environment variables
6. Deploy!

See `VERCEL_DEPLOYMENT.md` for detailed deployment instructions.

