#!/bin/bash

# Quick Vercel Deployment Script
# This script helps you deploy to Vercel quickly

echo "🚀 Lawyer Diary - Vercel Deployment Helper"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the 'web' directory."
    exit 1
fi

echo "✅ Found Next.js project"
echo ""

# Check for environment variables
echo "🔍 Checking environment variables..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found"
    echo "   Make sure to set these in Vercel dashboard:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
fi

# Ask user if they want to deploy
read -p "Do you want to deploy to Vercel now? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

# Run vercel
vercel

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add environment variables in Vercel dashboard if not already set"
echo "2. Update Supabase auth redirect URLs with your Vercel domain"
echo "3. Test your deployment at the provided URL"
echo ""

