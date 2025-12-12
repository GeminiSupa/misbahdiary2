# Vercel Deployment Guide

This guide will help you deploy the Lawyer Diary application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. A Supabase project (already set up)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Push Your Code to Git

If you haven't already, initialize a git repository and push your code:

```bash
cd /Users/apple/Desktop/LawerDiary
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-git-repo-url>
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web`
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `.next` (or leave default)
   - **Install Command**: `npm install` (or leave default)

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   cd /Users/apple/Desktop/LawerDiary
   vercel
   ```

4. Follow the prompts:
   - Set root directory to `web`
   - Confirm build settings

## Step 3: Configure Environment Variables

In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

### Required Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### How to Get These Values

1. Go to your Supabase project dashboard
2. Navigate to **Settings > API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Environment-Specific Variables

You can set different values for:
- **Production**: Your live site
- **Preview**: Branch deployments
- **Development**: Local development

## Step 4: Update Supabase Auth Settings

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > URL Configuration**
3. Add your Vercel URLs:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: 
     - `https://your-project.vercel.app/auth/callback`
     - `https://your-project.vercel.app/**`

## Step 5: Deploy

After setting environment variables:

1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Step 6: Verify Deployment

1. Visit your Vercel deployment URL
2. Test sign-up/sign-in functionality
3. Verify database connections work
4. Check that file uploads work (if using Supabase Storage)

## Troubleshooting

### Build Errors

- Check that all environment variables are set correctly
- Verify `next.config.ts` is properly configured
- Check build logs in Vercel dashboard

### Authentication Issues

- Verify Supabase redirect URLs are correct
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Ensure cookies are enabled in browser

### Database Connection Issues

- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (for admin operations)
- Check Supabase project is active
- Review RLS policies if data access fails

## Custom Domain (Optional)

1. Go to **Settings > Domains** in Vercel
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase redirect URLs with your custom domain

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pushes to other branches
- **Pull Requests**: Creates preview deployments

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Supabase Documentation](https://supabase.com/docs)

