import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Lawyer Diary in Karachi (SHC) — Hearings, Matters, Billing",
  description:
    "Case management for advocates in Karachi. Track Sindh High Court (SHC) hearings, matter timelines, client updates, and PKR billing in one workspace.",
  alternates: { canonical: "/karachi" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Lawyer Diary in Karachi (SHC)",
  description:
    "Case management for advocates in Karachi. Track Sindh High Court (SHC) hearings, matter timelines, client updates, and PKR billing in one workspace.",
  about: [
    { "@type": "Thing", name: "Sindh High Court (SHC)" },
    { "@type": "Thing", name: "Court hearings" },
    { "@type": "Thing", name: "Client communication" },
  ],
};

export default function KarachiLandingPage() {
  return (
    <div className="sap-shell">
      <Script id="karachi-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      <div className="sap-container py-10 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Karachi • SHC workflow
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Organize SHC hearings and matter timelines for Karachi practice
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              When dates move and timelines stretch, the fastest firms win by staying organized: one matter, one history, one source of truth.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground" href="/sign-up">
                Start free trial
              </Link>
              <Link className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-bold text-foreground" href="/blog/digital-lawyer-diary-pakistan">
                Read the digital diary guide
              </Link>
            </div>
          </header>

          <section className="sap-card">
            <div className="sap-card-body space-y-4">
              <h2 className="text-xl font-bold">What Karachi advocates use it for</h2>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Hearing readiness:</strong> dates, locations, and preparation notes tied to the matter.
                </li>
                <li>
                  <strong className="text-foreground">Client trust:</strong> clear updates and documented next steps, especially when timelines change.
                </li>
                <li>
                  <strong className="text-foreground">Billing clarity:</strong> invoices and payments tracked in PKR to reduce disputes and delays.
                </li>
                <li>
                  <strong className="text-foreground">Team coordination:</strong> assignments and shared history for faster handover.
                </li>
              </ul>
            </div>
          </section>

          <section className="sap-card">
            <div className="sap-card-body space-y-4">
              <h2 className="text-xl font-bold">Quick links</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link className="rounded-xl border border-border bg-background/60 p-4 text-sm font-semibold hover:bg-muted/30" href="/cases">
                  Matters
                </Link>
                <Link className="rounded-xl border border-border bg-background/60 p-4 text-sm font-semibold hover:bg-muted/30" href="/calendar">
                  Hearings calendar
                </Link>
                <Link className="rounded-xl border border-border bg-background/60 p-4 text-sm font-semibold hover:bg-muted/30" href="/billing">
                  Billing (PKR)
                </Link>
                <Link className="rounded-xl border border-border bg-background/60 p-4 text-sm font-semibold hover:bg-muted/30" href="/blog">
                  Blog
                </Link>
              </div>
            </div>
          </section>

          <section className="sap-card">
            <div className="sap-card-body space-y-4">
              <h2 className="text-xl font-bold">FAQs — Lawyer Diary in Karachi</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Is this suitable for SHC-focused work?</p>
                  <p>Yes — the calendar + matter timeline workflow is designed for day-to-day hearing practice.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Can clients see relevant updates?</p>
                  <p>Yes — clients can access a portal view for updates and messages, reducing repeated calls.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Does it work for firms and solo advocates?</p>
                  <p>Yes — start solo and scale to a team with role-based access.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

