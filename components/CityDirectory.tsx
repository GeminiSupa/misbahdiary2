import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { CITY_DATA, COMMON_FAQS } from "@/lib/city-data";

interface CityDirectoryProps {
  cityKey: string;
}

export function CityDirectory({ cityKey }: CityDirectoryProps) {
  const data = CITY_DATA[cityKey.toLowerCase()];

  if (!data) {
    return <div>City not found</div>;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Best Lawyers in ${data.city}`,
    description: data.intro,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: data.lawyers.map((l, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "LawBusiness",
          name: l.name,
          description: l.description,
          url: l.website || undefined,
        },
      })),
    },
  };

  return (
    <div className="sap-shell">
      <Script id={`city-jsonld-${cityKey}`} type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-50 to-white border-b border-black/5">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24 text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#f97316]">
            City Directory • {data.city}
          </p>
          <h1 className="text-4xl font-normal tracking-tight sm:text-5xl md:text-6xl text-black">
            Top Rated Lawyers in <span className="text-[#f97316]">{data.city}</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-black/60 sm:text-xl">
            {data.intro}
          </p>
          <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center">
            <Link
              href="#listings"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-black px-8 text-base font-semibold text-white shadow-lg transition-all hover:bg-black/80 active:scale-95"
            >
              Find a Lawyer
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-black/10 bg-white px-8 text-base font-semibold text-black shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            >
              Get Legal Advice
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main Content: Lawyer Listings */}
          <div className="lg:col-span-2 space-y-12">
            <section id="listings" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight text-black">Featured Law Firms</h2>
                <span className="text-sm font-medium text-black/40">{data.lawyers.length} Results</span>
              </div>
              <div className="space-y-6">
                {data.lawyers.map((lawyer, i) => (
                  <div key={i} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm transition-all hover:border-[#f97316]/30 hover:shadow-md">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-black">{lawyer.name}</h3>
                        <p className="text-sm font-semibold text-[#f97316]">{lawyer.specialization}</p>
                      </div>
                      {lawyer.website && (
                        <Link
                          href={lawyer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold text-[#f97316] hover:underline"
                        >
                          Visit Website
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      )}
                    </div>
                    <p className="mt-4 text-sm text-black/60 leading-relaxed">
                      {lawyer.description}
                    </p>
                    {lawyer.contact && (
                      <div className="flex items-center gap-2 pt-4 text-sm font-medium text-black/80">
                        <svg className="h-4 w-4 text-[#f97316]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {lawyer.contact}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* FAQs */}
            <section id="faqs" className="space-y-8 pt-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-black">Frequently Asked Questions</h2>
                <p className="text-sm text-black/50">Everything you need to know about legal help in {data.city}</p>
              </div>
              <div className="grid gap-6">
                {[...data.faqs, ...COMMON_FAQS].map((faq, i) => (
                  <div key={i} className="rounded-xl border border-black/5 bg-slate-50/50 p-6">
                    <h4 className="font-bold text-black">{faq.question}</h4>
                    <p className="mt-2 text-sm text-black/60">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <aside className="rounded-2xl bg-black p-6 text-white shadow-xl">
              <h3 className="text-lg font-bold">Are you a lawyer?</h3>
              <p className="mt-2 text-sm text-white/70">
                Manage your practice, track hearings, and stay organized with Lawyer Diary.
              </p>
              <Link
                href="/sign-up"
                className="mt-6 inline-flex w-full h-11 items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-black transition-all hover:bg-white/90"
              >
                Start Free Trial
              </Link>
            </aside>

            <aside className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-black">Practice Areas</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.practiceAreas.map((area, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-black/70"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </aside>

            <aside className="rounded-2xl border border-black/10 bg-slate-50 p-6">
              <h3 className="text-lg font-bold text-black">Contact Support</h3>
              <p className="mt-2 text-sm text-black/60">
                Need help choosing a lawyer? Our team can guide you to the right professional.
              </p>
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm text-black/70">
                  <div className="rounded-lg bg-black/5 p-2 text-black">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span>support@lawyerdiary.pk</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-black/70">
                  <div className="rounded-lg bg-black/5 p-2 text-black">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span>Mon - Sat: 9:00 AM - 6:00 PM</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
