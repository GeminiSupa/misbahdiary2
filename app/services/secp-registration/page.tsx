import type { Metadata } from "next";
import Link from "next/link";
import { LandingFooter } from "@/components/landing/landing-footer";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "SECP Registration Help",
  description:
    "Get guidance on SECP company registration in Pakistan. Vakeel Diary can point you to the right steps and resources.",
  alternates: {
    canonical: `${baseUrl.replace(/\/$/, "")}/services/secp-registration`,
  },
  robots: { index: true, follow: true },
};

export default function SecpRegistrationServicePage() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 text-base leading-relaxed text-slate-800 sm:px-6 sm:pt-10">
        <Link
          href="/secp-company-registration-pakistan"
          className="mb-6 inline-flex min-h-[44px] items-center text-sm font-medium text-slate-700 hover:text-black"
        >
          ← SECP company registration guide
        </Link>
        <h1 className="text-2xl font-bold text-black sm:text-3xl">SECP registration support</h1>
        <p className="mt-4 text-base">
          This page is a starting point for teams and founders who want structured help with{" "}
          <strong>company registration Pakistan SECP</strong> steps. For official rules, fees, and forms, always confirm
          details on{" "}
          <a
            href="https://www.secp.gov.pk/"
            className="font-medium text-[#f97316] underline-offset-2 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            secp.gov.pk
          </a>
          .
        </p>
        <p className="mt-4 text-base">
          Need help from Vakeel Diary?{" "}
          <Link href="/contact" className="font-medium text-[#f97316] underline-offset-2 hover:underline">
            Contact us
          </Link>{" "}
          or{" "}
          <Link href="/sign-up" className="font-medium text-[#f97316] underline-offset-2 hover:underline">
            create an account
          </Link>
          .
        </p>
      </main>
      <LandingFooter />
    </>
  );
}
