# Quick Vercel Deployment

## Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Go to**: https://vercel.com
2. **Sign in** with your GitHub account
3. **Click**: "Add New Project"
4. **Import**: `omer-Anima/misbahdiary1`
5. **Configure**:
   - Root Directory: `web`
   - Framework: Next.js (auto-detected)
6. **Environment Variables** (add these):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
7. **Click**: "Deploy"

## Option 2: Deploy via CLI

```bash
cd /Users/apple/Desktop/LawerDiary/web
npm install -g vercel
vercel
```

Follow the prompts:
- Set root directory to current directory (or `web`)
- Add environment variables when prompted
- Deploy!

## Get Environment Variables

From Supabase Dashboard:
1. Go to: https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## After Deployment

Update Supabase Auth URLs:
- Supabase → Authentication → URL Configuration
- Add: `https://your-project.vercel.app/auth/callback`
- Site URL: `https://your-project.vercel.app`

