import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * OAuth Diagnostics Page
 * 
 * This page helps diagnose OAuth configuration issues by:
 * 1. Checking environment variables
 * 2. Testing OAuth URL generation
 * 3. Checking current auth state
 * 
 * Access at: /diagnostics
 */
export default async function DiagnosticsPage() {
  const supabase = await createSupabaseServerClient();
  
  // Check auth state
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // Get environment variables (only public ones)
  const env = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT SET",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "NOT SET",
    vercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL || "NOT SET",
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  
  // Calculate redirect URL
  const calculatedSiteUrl = env.siteUrl !== "NOT SET" 
    ? env.siteUrl 
    : env.vercelUrl !== "NOT SET" 
    ? `https://${env.vercelUrl}` 
    : "http://localhost:3000";
  
  const redirectUrl = `${calculatedSiteUrl}/auth/callback`;
  
  // Try to generate OAuth URL (this will fail if not configured)
  let oauthTest: { success: boolean; url?: string; error?: string } = { success: false };
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });
    
    if (error) {
      oauthTest = { success: false, error: error.message };
    } else if (data?.url) {
      oauthTest = { success: true, url: data.url };
    } else {
      oauthTest = { success: false, error: "No URL returned" };
    }
  } catch (err) {
    oauthTest = { 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    };
  }
  
  // Extract Supabase callback URL
  const supabaseCallbackUrl = env.supabaseUrl !== "NOT SET" 
    ? `${env.supabaseUrl}/auth/v1/callback`
    : "NOT SET";
  
  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-4">OAuth Diagnostics</h1>
          <p className="text-slate-400 mb-6">
            This page helps diagnose OAuth configuration issues. Check each section below.
          </p>
        </div>

        {/* Environment Variables */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">1. Environment Variables</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className={env.supabaseUrl !== "NOT SET" ? "text-green-400" : "text-red-400"}>
                {env.supabaseUrl !== "NOT SET" ? "✅" : "❌"}
              </span>
              <span className="text-slate-300">NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className="text-slate-400">{env.supabaseUrl}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={env.siteUrl !== "NOT SET" ? "text-green-400" : "text-yellow-400"}>
                {env.siteUrl !== "NOT SET" ? "✅" : "⚠️"}
              </span>
              <span className="text-slate-300">NEXT_PUBLIC_SITE_URL:</span>
              <span className="text-slate-400">{env.siteUrl}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={env.vercelUrl !== "NOT SET" ? "text-green-400" : "text-yellow-400"}>
                {env.vercelUrl !== "NOT SET" ? "✅" : "⚠️"}
              </span>
              <span className="text-slate-300">NEXT_PUBLIC_VERCEL_URL:</span>
              <span className="text-slate-400">{env.vercelUrl}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={env.hasAnonKey ? "text-green-400" : "text-red-400"}>
                {env.hasAnonKey ? "✅" : "❌"}
              </span>
              <span className="text-slate-300">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className="text-slate-400">{env.hasAnonKey ? "Set" : "NOT SET"}</span>
            </div>
          </div>
        </div>

        {/* Calculated URLs */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">2. Calculated URLs</h2>
          <div className="space-y-3 font-mono text-sm">
            <div>
              <span className="text-slate-400">Site URL (what your app uses):</span>
              <div className="text-green-400 mt-1">{calculatedSiteUrl}</div>
            </div>
            <div>
              <span className="text-slate-400">Redirect URL (what your app uses):</span>
              <div className="text-green-400 mt-1">{redirectUrl}</div>
            </div>
            <div>
              <span className="text-slate-400">Supabase Callback URL:</span>
              <div className="text-blue-400 mt-1">{supabaseCallbackUrl}</div>
              <p className="text-xs text-slate-500 mt-1">
                ⚠️ This MUST be in Google Cloud Console → OAuth Client ID → Authorized redirect URIs
              </p>
            </div>
          </div>
        </div>

        {/* OAuth Test */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">3. OAuth URL Generation Test</h2>
          {oauthTest.success ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <span>✅</span>
                <span>OAuth URL generated successfully!</span>
              </div>
              <div className="bg-slate-900 p-3 rounded font-mono text-xs text-slate-300 break-all">
                {oauthTest.url?.substring(0, 200)}...
              </div>
              <p className="text-sm text-slate-400">
                This means Supabase can generate OAuth URLs. Check the URL above to verify the redirect_uri parameter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-400">
                <span>❌</span>
                <span>Failed to generate OAuth URL</span>
              </div>
              <div className="bg-red-900/20 border border-red-500/50 p-3 rounded">
                <p className="text-red-300 font-mono text-sm">{oauthTest.error}</p>
              </div>
              <div className="text-sm text-slate-400 space-y-1">
                <p><strong>Common causes:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Google OAuth not enabled in Supabase</li>
                  <li>Client ID/Secret not configured in Supabase</li>
                  <li>Redirect URL mismatch in Supabase settings</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Auth State */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">4. Current Auth State</h2>
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400">
                <span>✅</span>
                <span>User is authenticated</span>
              </div>
              <div className="font-mono text-sm text-slate-300">
                <div>User ID: {user.id}</div>
                <div>Email: {user.email || "No email"}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-yellow-400">
                <span>⚠️</span>
                <span>No user authenticated</span>
              </div>
              {authError && (
                <div className="text-sm text-red-400">
                  Error: {authError.message}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Configuration Checklist */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">5. Configuration Checklist</h2>
          <div className="space-y-3 text-sm">
            <div>
              <h3 className="font-semibold text-white mb-2">Supabase Dashboard → Authentication → URL Configuration</h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-slate-400">
                <li>Site URL: <code className="text-blue-400">{calculatedSiteUrl}</code></li>
                <li>Redirect URLs: <code className="text-blue-400">{calculatedSiteUrl}/**</code></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Google Cloud Console → Credentials → OAuth Client ID</h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-slate-400">
                <li>Authorized JavaScript origins: <code className="text-blue-400">{env.supabaseUrl !== "NOT SET" ? env.supabaseUrl : "YOUR_SUPABASE_URL"}</code></li>
                <li>Authorized redirect URIs: <code className="text-blue-400">{supabaseCallbackUrl}</code></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Supabase Dashboard → Auth → Providers → Google</h3>
              <ul className="list-disc list-inside ml-4 space-y-1 text-slate-400">
                <li>Enabled: ON</li>
                <li>Client ID: Set</li>
                <li>Client Secret: Set</li>
                <li>Save button clicked</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Supabase Auth Logs Link */}
        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-2">6. Check Supabase Auth Logs</h2>
          <p className="text-slate-300 mb-4">
            The most important step: Check your Supabase Auth Logs for the exact error message.
          </p>
          <a
            href="https://supabase.com/dashboard/project/xsdqwbcpvdreawkyvpnk/logs/auth-logs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            Open Supabase Auth Logs →
          </a>
          <p className="text-sm text-slate-400 mt-3">
            Look for your recent OAuth attempt and check the error message. Common errors:
          </p>
          <ul className="list-disc list-inside ml-4 mt-2 text-sm text-slate-400 space-y-1">
            <li><code className="text-red-400">redirect_uri_mismatch</code> → URL configuration issue</li>
            <li><code className="text-red-400">invalid_client</code> → Google OAuth not configured</li>
            <li><code className="text-red-400">access_denied</code> → User denied or consent screen issue</li>
            <li><code className="text-red-400">PKCE code verifier not found</code> → Cookie issue</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <a
            href="/sign-in"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            Go to Sign In
          </a>
          <a
            href="/"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}
