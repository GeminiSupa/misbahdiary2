import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Lawyer Diary in Lahore (LHC) — Case & Hearing Management",
  description:
    "Case management for advocates in Lahore. Track matters, Lahore High Court (LHC) hearings, client updates, and PKR billing in one workspace.",
  alternates: { canonical: "/lahore" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Lawyer Diary in Lahore (LHC)",
  description:
    "Case management for advocates in Lahore. Track matters, Lahore High Court (LHC) hearings, client updates, and PKR billing in one workspace.",
  about: [
    { "@type": "Thing", name: "Lahore High Court (LHC)" },
    { "@type": "Thing", name: "Case management" },
    { "@type": "Thing", name: "Court hearings" },
  ],
};

export default function LahoreLandingPage() {
  return (
    <div className="sap-shell">
      <Script id="lahore-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      <div className="sap-container py-10 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Lahore • LHC workflow
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Case management for advocates in Lahore (Lahore High Court)
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Keep your LHC dates, matter history, and client follow-ups organized — with PKR billing and a client portal.
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
              <h2 className="text-xl font-bold">Built for Lahore practice realities</h2>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">Hearing discipline:</strong> track next date, reason, and preparation notes in one place.
                </li>
                <li>
                  <strong className="text-foreground">Matter history:</strong> avoid losing context across adjournments and long gaps.
                </li>
                <li>
                  <strong className="text-foreground">Client updates:</strong> keep what was communicated documented and easy to reference.
                </li>
                <li>
                  <strong className="text-foreground">PKR billing:</strong> invoices, payments, outstanding — without separate spreadsheets.
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
              <h2 className="text-xl font-bold">FAQs — Lawyer Diary in Lahore</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Does this help with Lahore High Court hearing management?</p>
                  <p>Yes — hearings, next dates, and matter context are tracked together so you don’t lose the thread.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Can my juniors and staff collaborate?</p>
                  <p>Yes — you can assign matters and keep one shared timeline for the whole team.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Is it useful for a solo advocate in Lahore?</p>
                  <p>Yes — start with active matters first, then add the rest gradually.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

