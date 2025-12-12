# 🚀 Deploy to Vercel - Ready!

## ✅ Vercel CLI Installed
Vercel CLI is now installed in your project.

## 🎯 Deploy Now (Choose One Method)

### Method 1: Vercel Dashboard (Easiest - Recommended)

1. **Go to**: https://vercel.com
2. **Sign in** with GitHub
3. **Click**: "Add New Project"
4. **Import**: `omer-Anima/misbahdiary1`
5. **Set Root Directory**: `web`
6. **Add Environment Variables** (see below)
7. **Click**: "Deploy"

### Method 2: Vercel CLI (Command Line)

Run this command:

```bash
cd /Users/apple/Desktop/LawerDiary/web
npx vercel
```

**Follow the prompts:**
- Login to Vercel (will open browser)
- Link to existing project or create new
- Set root directory: `web` (or current directory)
- Add environment variables when prompted
- Deploy!

## 🔑 Required Environment Variables

Add these in Vercel (Dashboard or CLI):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Get from**: Supabase Dashboard → Settings → API

## 📋 Quick Deploy Checklist

- [ ] Code on GitHub ✅ (Done!)
- [ ] Vercel CLI installed ✅ (Done!)
- [ ] Go to Vercel Dashboard or run `npx vercel`
- [ ] Set root directory to `web`
- [ ] Add 3 environment variables
- [ ] Deploy!
- [ ] Update Supabase auth URLs

## 🎉 After Deployment

1. **Get your Vercel URL**: `https://your-project.vercel.app`
2. **Update Supabase**:
   - Authentication → URL Configuration
   - Add redirect: `https://your-project.vercel.app/auth/callback`
   - Set site URL: `https://your-project.vercel.app`

## 🚀 Ready to Deploy!

Everything is set up. Just go to https://vercel.com and import your project!

