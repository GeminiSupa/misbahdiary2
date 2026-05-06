import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Lawyer Diary in Islamabad (IHC) — Matters & Hearing Calendar",
  description:
    "Case management for advocates in Islamabad. Track Islamabad High Court (IHC) hearings, matter history, client updates, and PKR billing in one workspace.",
  alternates: { canonical: "/islamabad" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Lawyer Diary in Islamabad (IHC)",
  description:
    "Case management for advocates in Islamabad. Track Islamabad High Court (IHC) hearings, matter history, client updates, and PKR billing in one workspace.",
  about: [
    { "@type": "Thing", name: "Islamabad High Court (IHC)" },
    { "@type": "Thing", name: "Writ petitions" },
    { "@type": "Thing", name: "Court hearings" },
  ],
};

export default function IslamabadLandingPage() {
  return (
    <div className="sap-shell">
      <Script id="islamabad-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      <div className="sap-container py-10 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Islamabad • IHC workflow
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Stay ahead of IHC dates, filings, and client updates in Islamabad
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              When scheduling changes, access restrictions, and tight timelines collide, a clean system helps you respond faster and keep clients informed.
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
              <h2 className="text-xl font-bold">Designed for Islamabad practice</h2>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Writ and constitutional work:</strong> keep grounds, dates, and filings tied to the matter.
                </li>
                <li>
                  <strong className="text-foreground">Client confidence:</strong> timeline entries make “what happened last time” clear.
                </li>
                <li>
                  <strong className="text-foreground">Fast retrieval:</strong> search cases, clients, invoices, and references from one place.
                </li>
                <li>
                  <strong className="text-foreground">Billing + follow-up:</strong> track invoices and outstanding amounts without manual reconciliation.
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
              <h2 className="text-xl font-bold">FAQs — Lawyer Diary in Islamabad</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Does it help manage IHC hearings and deadlines?</p>
                  <p>Yes — hearings and next steps are tracked with each matter so deadlines don’t get missed.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Can clients access relevant updates?</p>
                  <p>Yes — clients can view portal updates and messages, reducing repeated follow-ups.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Can I start small and expand later?</p>
                  <p>Yes — begin with active matters and scale as your practice grows.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

