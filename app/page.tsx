import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://ux4u.online";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Lawyer Diary – Legal Practice Management for Pakistani Law Firms",
  description:
    "Case management, billing, calendar & hearings. Modern software for law firms and solo practitioners in Pakistan.",
  keywords: [
    "law practice management",
    "lawyer diary",
    "case management Pakistan",
    "legal billing software",
    "law firm software",
    "advocate management",
  ],
  openGraph: {
    title: "Lawyer Diary – Legal Practice Management for Pakistani Law Firms",
    description:
      "Case management, billing, calendar & hearings. Modern software for law firms and solo practitioners in Pakistan.",
    type: "website",
    url: baseUrl,
    siteName: "Lawyer Diary by UX4U",
    images: [
      {
        url: "/ux4u-logo.png",
        width: 400,
        height: 400,
        alt: "UX4U Logo - Legal Practice Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lawyer Diary – Legal Practice Management for Pakistani Law Firms",
    description:
      "Case management, billing, calendar & hearings. Modern software for law firms and solo practitioners in Pakistan.",
    images: ["/ux4u-logo.png"],
  },
  alternates: {
    canonical: baseUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "theme-color": "#ffffff",
  },
};

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return <LandingPage />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id, is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  const isSuperAdmin = (profile as { is_super_admin?: boolean } | null)
    ?.is_super_admin === true;

  if (!profile?.firm_id && !isSuperAdmin) {
    redirect("/onboarding");
  }

  if (isSuperAdmin) {
    redirect("/admin");
  }

  redirect("/dashboard");
}
