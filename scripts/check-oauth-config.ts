/**
 * OAuth Configuration Diagnostic Tool
 * 
 * This script checks your OAuth configuration and identifies potential issues.
 * Run with: npx tsx scripts/check-oauth-config.ts
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

async function checkOAuthConfig() {
  console.log("🔍 Checking OAuth Configuration...\n");
  
  // 1. Check Environment Variables
  console.log("1️⃣ Environment Variables:");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✅ Set" : "❌ Missing"}`);
  if (supabaseUrl) {
    console.log(`      Value: ${supabaseUrl}`);
    // Extract project ID
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (projectId) {
      console.log(`      Project ID: ${projectId}`);
    }
  }
  
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? "✅ Set" : "❌ Missing"}`);
  if (supabaseAnonKey) {
    console.log(`      Length: ${supabaseAnonKey.length} characters`);
  }
  
  console.log(`   NEXT_PUBLIC_SITE_URL: ${siteUrl ? "✅ Set" : "⚠️  Not set (will use fallback)"}`);
  if (siteUrl) {
    console.log(`      Value: ${siteUrl}`);
    // Check for trailing slash
    if (siteUrl.endsWith("/")) {
      console.log(`      ⚠️  WARNING: Has trailing slash! Should be: ${siteUrl.slice(0, -1)}`);
    }
  }
  
  console.log(`   NEXT_PUBLIC_VERCEL_URL: ${vercelUrl ? "✅ Set" : "⚠️  Not set"}`);
  if (vercelUrl) {
    console.log(`      Value: ${vercelUrl}`);
  }
  
  // 2. Calculate Redirect URLs
  console.log("\n2️⃣ Redirect URLs (what your code will use):");
  const calculatedSiteUrl = siteUrl ?? vercelUrl ?? "http://localhost:3000";
  const redirectUrl = `${calculatedSiteUrl}/auth/callback`;
  console.log(`   Calculated Site URL: ${calculatedSiteUrl}`);
  console.log(`   Redirect URL: ${redirectUrl}`);
  
  // 3. Expected Supabase Callback URL
  console.log("\n3️⃣ Expected Supabase Configuration:");
  if (supabaseUrl) {
    const supabaseCallbackUrl = `${supabaseUrl}/auth/v1/callback`;
    console.log(`   Supabase Callback URL: ${supabaseCallbackUrl}`);
    console.log(`   ⚠️  This MUST be in Google Cloud Console → OAuth Client ID → Authorized redirect URIs`);
  }
  
  // 4. Expected Supabase Dashboard Settings
  console.log("\n4️⃣ Supabase Dashboard Settings (Authentication → URL Configuration):");
  console.log(`   Site URL should be: ${calculatedSiteUrl}`);
  console.log(`   Redirect URLs should include: ${calculatedSiteUrl}/**`);
  if (siteUrl && siteUrl !== calculatedSiteUrl) {
    console.log(`   ⚠️  WARNING: NEXT_PUBLIC_SITE_URL (${siteUrl}) doesn't match calculated URL (${calculatedSiteUrl})`);
  }
  
  // 5. Test OAuth URL Generation
  console.log("\n5️⃣ Testing OAuth URL Generation:");
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });
    
    if (error) {
      console.log(`   ❌ Error generating OAuth URL: ${error.message}`);
      console.log(`   This usually means:`);
      console.log(`   - Google OAuth not enabled in Supabase`);
      console.log(`   - Client ID/Secret not configured in Supabase`);
      console.log(`   - Redirect URL mismatch in Supabase settings`);
    } else if (data?.url) {
      console.log(`   ✅ OAuth URL generated successfully!`);
      console.log(`   URL: ${data.url.substring(0, 100)}...`);
      
      // Parse the URL to check redirect_uri
      const url = new URL(data.url);
      const redirectUri = url.searchParams.get("redirect_uri");
      if (redirectUri) {
        console.log(`   Redirect URI in OAuth URL: ${redirectUri}`);
        const expectedCallback = `${supabaseUrl}/auth/v1/callback`;
        if (redirectUri === expectedCallback) {
          console.log(`   ✅ Redirect URI matches Supabase callback URL`);
        } else {
          console.log(`   ⚠️  Redirect URI doesn't match expected: ${expectedCallback}`);
        }
      }
    } else {
      console.log(`   ❌ No URL returned from OAuth`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err instanceof Error ? err.message : String(err)}`);
  }
  
  // 6. Configuration Checklist
  console.log("\n6️⃣ Configuration Checklist:");
  console.log("\n   Supabase Dashboard → Authentication → URL Configuration:");
  console.log(`   [ ] Site URL is set to: ${calculatedSiteUrl}`);
  console.log(`   [ ] Redirect URLs includes: ${calculatedSiteUrl}/**`);
  
  console.log("\n   Supabase Dashboard → Authentication → Providers → Google:");
  console.log(`   [ ] Google provider is enabled`);
  console.log(`   [ ] Client ID is set (from Google Cloud Console)`);
  console.log(`   [ ] Client Secret is set (from Google Cloud Console)`);
  console.log(`   [ ] Save button was clicked`);
  
  console.log("\n   Google Cloud Console → Credentials → OAuth Client ID:");
  if (supabaseUrl) {
    console.log(`   [ ] Authorized JavaScript origins includes: ${supabaseUrl}`);
    console.log(`   [ ] Authorized redirect URIs includes: ${supabaseUrl}/auth/v1/callback`);
  }
  
  console.log("\n   Google Cloud Console → OAuth Consent Screen:");
  console.log(`   [ ] App status is "Testing" or "Published"`);
  console.log(`   [ ] User type is "External"`);
  console.log(`   [ ] Your email is added as a Test User (if Testing mode)`);
  console.log(`   [ ] Scopes include: email, profile, openid`);
  
  console.log("\n✅ Configuration check complete!");
  console.log("\n💡 Next Steps:");
  console.log("   1. Verify all checklist items above");
  console.log("   2. Check Supabase Auth Logs for specific errors:");
  console.log("      https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/logs/auth-logs");
  console.log("   3. Try logging in again and check the logs");
}

// Run the check
checkOAuthConfig().catch(console.error);
