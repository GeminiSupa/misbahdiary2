# Vercel Deployment Guide - Final Version

## ✅ Optimized for Vercel

This codebase has been optimized for Vercel deployment with:
- Removed heavy dependencies (pdf-parse, mammoth, chromadb, langchain)
- Optimized Next.js configuration
- Serverless-friendly file processing
- Reduced bundle size

## 🚀 Quick Deploy

### 1. Push to Git
```bash
git add .
git commit -m "Optimized for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

**Option B: Via Vercel CLI**
```bash
cd web
npx vercel
```

### 3. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key (optional, for AI features)
```

### 4. Deploy

Click "Deploy" or push a new commit to trigger automatic deployment.

## 📦 What Was Removed

- `pdf-parse` - Heavy native module (use external service for PDF)
- `mammoth` - DOCX parser (use external service)
- `chromadb` - Not needed for basic functionality
- `@langchain/*` - Using OpenAI SDK directly
- `@supabase/auth-helpers-*` - Using @supabase/ssr only
- `pg` - Not needed in Next.js app
- Multiple documentation files

## ⚙️ Configuration

### vercel.json
- Root directory: `web`
- Extended timeout for AI routes (300s)
- Environment variables configured

### next.config.ts
- Standalone output for better performance
- Package import optimizations
- Webpack optimizations
- Security headers

## 🔧 File Processing

PDF/DOCX files:
- Currently supports text files only
- For PDF/DOCX, use external services or add processing in API routes
- Document metadata is still stored and searchable

## 📝 Notes

1. **Database Function**: Run `supabase/functions/match_document_embeddings.sql` in Supabase SQL editor for vector search
2. **File Size Limits**: Vercel has 4.5MB limit for serverless functions
3. **Timeouts**: AI routes have extended timeout (300s)
4. **Environment Variables**: Set all required vars in Vercel dashboard

## ✅ Deployment Checklist

- [ ] Code pushed to Git
- [ ] Vercel project created
- [ ] Root directory set to `web`
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Supabase vector extension enabled
- [ ] Test deployment

## 🎉 Ready to Deploy!

Your codebase is now optimized and ready for Vercel deployment.
