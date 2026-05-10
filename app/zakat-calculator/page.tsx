import type { Metadata } from "next";
import Script from "next/script";
import ZakatCalculator from "@/components/ZakatCalculator";
import { LandingFooter } from "@/components/landing/landing-footer";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Zakat Calculator Pakistan 2026 | Multi-Currency",
  description:
    "Free Zakat calculator for Pakistan with multi-currency conversion, fiqh views, and gold/silver nisab comparison. Calculate Zakat in USD, PKR, SAR, AED, INR, EUR, and GBP.",
  alternates: {
    canonical: `${baseUrl}/zakat-calculator`,
  },
  openGraph: {
    title: "Zakat Calculator Pakistan 2026",
    description:
      "Advanced multi-currency Zakat calculator with fiqh selector and gold/silver nisab logic.",
    url: `${baseUrl}/zakat-calculator`,
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How is Zakat calculated in this tool?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The calculator totals zakatable wealth, compares it against selected nisab (gold or silver), and applies 2.5% if the nisab threshold is met.",
      },
    },
    {
      "@type": "Question",
      name: "Does this Zakat calculator support PKR and other currencies?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. It supports USD, EUR, GBP, PKR, SAR, AED, and INR, with live exchange-rate conversion.",
      },
    },
    {
      "@type": "Question",
      name: "Is my Zakat data stored or tracked?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. All calculations happen in your browser and data is not stored in a database.",
      },
    },
  ],
};

export default function ZakatCalculatorPage() {
  return (
    <div className="sap-shell min-h-screen">
      <Script id="zakat-faq-schema" type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </Script>

      <div className="sap-container py-8 sm:py-10">
        <header className="mx-auto mb-6 max-w-5xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Free Islamic finance tool
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Zakat Calculator (Multi-Currency)
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            Calculate your Zakat using live exchange rates, configurable fiqh views, and gold/silver nisab methods.
          </p>
        </header>

        <ZakatCalculator />
      </div>

      <LandingFooter variant="legal" />
    </div>
  );
}

