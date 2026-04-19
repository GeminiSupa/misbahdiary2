import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { LandingFooter } from "@/components/landing/landing-footer";
import { StartRegistrationButton } from "./cta-button";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const pagePath = "/secp-company-registration-pakistan";
const pageUrl = `${baseUrl}${pagePath}`;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    absolute: "SECP Company Registration Pakistan 2026 | Complete Guide",
  },
  description:
    "Complete guide for SECP company registration Pakistan. Learn process, fees, documents, and step-by-step registration.",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "SECP Company Registration Pakistan 2026",
    description: "Step-by-step guide to SECP company registration in Pakistan.",
    type: "article",
    url: pageUrl,
  },
};

const articleLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "SECP Company Registration Pakistan",
  description: "Step-by-step SECP company registration guide in Pakistan.",
  author: {
    "@type": "Organization",
    name: "Vakeel Diary",
  },
  publisher: {
    "@type": "Organization",
    name: "Vakeel Diary",
  },
  mainEntityOfPage: pageUrl,
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How long does SECP registration take?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Usually 2–5 working days after you submit complete documents and any queries are resolved. Complex cases or name objections can take longer.",
      },
    },
    {
      "@type": "Question",
      name: "What is SECP registration fee in Pakistan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Fees depend on company type, nominal capital, and current SECP schedules. Check the official fee section on secp.gov.pk before payment.",
      },
    },
    {
      "@type": "Question",
      name: "Can I register a company online in Pakistan?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Most incorporations run through SECP eServices: name reservation, digital forms, and fee payment where applicable.",
      },
    },
    {
      "@type": "Question",
      name: "What documents are required?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Typically CNICs of subscribers and directors, registered office particulars, memorandum and articles, and consent of directors—exact lists depend on company type and latest SECP forms.",
      },
    },
  ],
};

export default function SecpCompanyRegistrationPakistanPage() {
  return (
    <>
      <Script
        id="ld-article-secp"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <Script
        id="ld-faq-secp"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 text-base text-slate-800 sm:px-6 sm:pt-8 lg:px-8">
        <Link
          href="/blog"
          className="mb-6 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-slate-700 transition hover:text-black"
        >
          ← Blog
        </Link>

        <article className="space-y-6">
          <h1 className="text-2xl font-bold leading-tight text-black sm:text-3xl md:text-4xl">
            SECP company registration Pakistan: 2026 practical guide
          </h1>

          <p className="text-base leading-relaxed text-black/90">
            <strong>SECP company registration Pakistan</strong> is the standard route to incorporate a company under the
            Companies Act 2017. Whether you are launching a startup or formalizing an existing business, understanding
            the <strong>SECP registration process Pakistan</strong> helps you avoid common filing errors.
          </p>
          <p className="text-base leading-relaxed text-black/90">
            This guide summarizes how <strong>company registration Pakistan SECP</strong> works online, which documents
            to keep ready, and where <strong>SECP fees Pakistan</strong> fit into your plan—always pair this overview
            with the official portal for current amounts.
          </p>
          <p className="text-base leading-relaxed text-black/90">
            If you want a broader comparison of structures before you incorporate, read our{" "}
            <Link
              href="/blog/business-registration-pakistan"
              className="font-medium text-[#f97316] underline-offset-2 hover:underline"
            >
              business registration Pakistan overview
            </Link>
            . For hands-on help, see{" "}
            <Link href="/services/secp-registration" className="font-medium text-[#f97316] underline-offset-2 hover:underline">
              SECP registration support
            </Link>
            .
          </p>

          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/10 bg-white">
            <Image
              src="/secp-registration-process.jpg"
              alt="SECP company registration process Pakistan"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              loading="lazy"
            />
          </div>

          <h2 className="text-xl font-semibold leading-snug text-black sm:text-2xl">
            SECP registration process Pakistan: what to expect
          </h2>
          <p className="text-base leading-relaxed text-black/90">
            Most teams move through a predictable sequence: account on eServices, name availability, form submission,
            and fee payment. Expect a few revision cycles if your name or attachments need correction.
          </p>
          <h3 className="text-lg font-semibold text-black sm:text-xl">Core checkpoints</h3>
          <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-black/90 sm:pl-6">
            <li>Secure a unique name that follows SECP naming rules.</li>
            <li>Align shareholding, directors, and registered office details across all forms.</li>
            <li>Upload clear scans—blurred CNIC copies are a frequent delay.</li>
          </ul>

          <h2 className="text-xl font-semibold leading-snug text-black sm:text-2xl">
            Company registration Pakistan SECP: documents that matter
          </h2>
          <p className="text-base leading-relaxed text-black/90">
            Exact annexures change with company type, but directors and subscribers should keep identity and address
            proofs ready before you start the session.
          </p>
          <h3 className="text-lg font-semibold text-black sm:text-xl">Typical building blocks</h3>
          <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-black/90 sm:pl-6">
            <li>CNICs of subscribers and directors (valid, legible).</li>
            <li>Registered office lease or ownership evidence where required.</li>
            <li>Memorandum and articles aligned to your objects and capital.</li>
            <li>Director consent and declaration per latest formats.</li>
          </ul>

          <h2 className="text-xl font-semibold leading-snug text-black sm:text-2xl">
            SECP fees Pakistan and realistic timelines
          </h2>
          <p className="text-base leading-relaxed text-black/90">
            Schedules update; never rely on third-party fee tables alone. Cross-check the official schedule before you
            pay, and keep receipts inside your compliance folder.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-black/90 sm:pl-6">
            <li>
              <strong>SECP fees Pakistan</strong> vary with authorized capital and company category.
            </li>
            <li>Many straightforward filings finalize within a few working days once complete.</li>
            <li>Name objections or queries extend the clock—respond promptly in the portal.</li>
          </ul>

          <h2 className="text-xl font-semibold leading-snug text-black sm:text-2xl">
            How to register company in Pakistan through SECP online
          </h2>
          <p className="text-base leading-relaxed text-black/90">
            The eServices workflow is built for end-to-end digital submission. Work from a checklist so you do not miss
            director consents or office particulars mid-session.
          </p>
          <h3 className="text-lg font-semibold text-black sm:text-xl">Practical habits</h3>
          <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-black/90 sm:pl-6">
            <li>Save drafts and double-check spellings against CNICs.</li>
            <li>Use official PDFs only—outdated forms cause rejections.</li>
            <li>Keep a single shared folder for the team to upload consistent versions.</li>
          </ul>
          <p className="text-base leading-relaxed text-black/90">
            The authoritative source for law, notices, and updates is{" "}
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

          <h2 className="text-xl font-semibold leading-snug text-black sm:text-2xl">
            FAQs – SECP Company Registration Pakistan
          </h2>

          <h3 className="text-lg font-semibold text-black sm:text-xl">How long does SECP registration take?</h3>
          <p className="text-base leading-relaxed text-black/90">
            Often about two to five working days for straightforward files, longer if SECP raises queries or your name
            is contested.
          </p>

          <h3 className="text-lg font-semibold text-black sm:text-xl">What is SECP registration fee in Pakistan?</h3>
          <p className="text-base leading-relaxed text-black/90">
            Fees depend on capital, company type, and current schedules—verify the live table on the official website
            before you pay.
          </p>

          <h3 className="text-lg font-semibold text-black sm:text-xl">Can I register a company online in Pakistan?</h3>
          <p className="text-base leading-relaxed text-black/90">
            Yes. The eServices portal is designed for digital incorporation, including payments and document uploads
            where applicable.
          </p>

          <h3 className="text-lg font-semibold text-black sm:text-xl">What documents are required?</h3>
          <p className="text-base leading-relaxed text-black/90">
            You will generally need identity documents for subscribers and directors, registered office details, M&amp;A,
            and director consents—confirm the exact bundle for your entity type on SECP forms.
          </p>

          <section className="rounded-xl border border-black/10 bg-black/[0.03] p-5 sm:p-6" aria-labelledby="cta-heading">
            <h2 id="cta-heading" className="text-xl font-semibold text-black sm:text-2xl">
              Get help from Vakeel Diary
            </h2>
            <p className="mt-3 text-base leading-relaxed text-black/90">
              Need help with SECP registration? Contact Vakeel Diary today.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <StartRegistrationButton />
              <Link
                href="/contact"
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-base font-medium text-slate-800 transition hover:bg-slate-50"
              >
                Contact
              </Link>
            </div>
          </section>
        </article>
      </main>
      <LandingFooter />
    </>
  );
}
