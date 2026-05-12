import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/app/providers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID || "ca-pub-4731703376366094";
const googleCmpEnabled = process.env.NEXT_PUBLIC_GOOGLE_CMP_ENABLED !== "false";
const fundingChoicesSiteId = process.env.NEXT_PUBLIC_GOOGLE_FC_SITE_ID || "";
const fundingChoicesPubPath = adsenseClient.replace(/^ca-/, "");

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lawyer Diary & Case Management",
  description:
    "Modern legal practice management software tailored for Pakistani law firms and solo practitioners.",
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
    data: { session },
  } = await supabase.auth.getSession();

  let lang = "en";
  if (session?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("language_preference")
      .eq("id", session.user.id)
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
        <Script
          id="google-adsense"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
