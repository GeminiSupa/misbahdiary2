import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/app/providers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MagicLinkHashRecovery } from "@/components/auth/magic-link-hash-recovery";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID || "ca-pub-4731703376366094";
const googleCmpEnabled = process.env.NEXT_PUBLIC_GOOGLE_CMP_ENABLED !== "false";
const fundingChoicesSiteId = process.env.NEXT_PUBLIC_GOOGLE_FC_SITE_ID || "";
const fundingChoicesPubPath = adsenseClient.replace(/^ca-/, "");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Lawyer Diary – Legal Practice Management for Pakistani Law Firms",
    template: "%s | Lawyer Diary",
  },
  description:
    "Case management, billing, calendar & hearings. Modern software for law firms and solo practitioners in Pakistan.",
  verification: {
    google: "u517o2FOWT9NPw36PnH1CdDQcfXhjPetms-MjehW--E",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
  },
  other: {
    "google-adsense-account": adsenseClient,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let lang = "en";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("language_preference")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.language_preference) {
      lang =
        profile.language_preference === "ur" ? "ur" : "en";
    }
  }

  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>
          <Suspense fallback={null}>
            <MagicLinkHashRecovery />
          </Suspense>
          {children}
        </AppProviders>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        )}
        {/* Google CMP / Funding Choices (load before AdSense requests) */}
        {googleCmpEnabled && (
          <>
            <Script
              id="google-funding-choices"
              async
              strategy="afterInteractive"
              src={`https://fundingchoicesmessages.google.com/i/${fundingChoicesPubPath}?ers=1${fundingChoicesSiteId ? `&fc=${encodeURIComponent(fundingChoicesSiteId)}` : ""}`}
            />
            <Script id="google-fc-present" strategy="afterInteractive">
              {`(function(){function signalGooglefcPresent(){if(!window.frames['googlefcPresent']){if(document.body){const iframe=document.createElement('iframe');iframe.style='width:0;height:0;border:none;z-index:-1000;left:-1000px;top:-1000px;display:none;';iframe.name='googlefcPresent';document.body.appendChild(iframe);}else{setTimeout(signalGooglefcPresent,0);}}}signalGooglefcPresent();})();`}
            </Script>
          </>
        )}
        {/* Google AdSense */}
        <Script
          id="google-adsense"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Meta Pixel (Facebook) */}
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1470102801279351');
          fbq('track', 'PageView');`}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1470102801279351&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}
