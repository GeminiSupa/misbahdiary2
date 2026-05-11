import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { CITY_DATA, COMMON_FAQS } from "@/lib/city-data";

export async function generateStaticParams() {
  return Object.keys(CITY_DATA).map((city) => ({
    city: city,
  }));
}

interface PageProps {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const data = CITY_DATA[city.toLowerCase()];

  if (!data) {
    return {
      title: "Lawyers in Pakistan",
    };
  }

  return {
    title: `Best Lawyers in ${data.city} | Lawyer Listings & Legal Services`,
    description: `Find top-rated lawyers and law firms in ${data.city}. Explore practice areas, FAQs, and contact information for legal services in ${data.city}, Pakistan.`,
    alternates: { canonical: `/lawyers-in-${city.toLowerCase()}` },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { city } = await params;
  const data = CITY_DATA[city.toLowerCase()];

  if (!data) {
    notFound();
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
      <Script id="city-jsonld" type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </Script>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-secondary/50 to-background border-b border-border/50">
        <div className="sap-container py-12 sm:py-16 md:py-20">
          <div className="mx-auto max-w-4xl text-center space-y-6">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              City Directory • {data.city}
            </p>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl text-foreground">
              Top Rated Lawyers in <span className="text-primary">{data.city}</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {data.intro}
            </p>
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center">
              <Link
                href="/sign-up"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-8 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
              >
                Find a Lawyer
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-border bg-card px-8 text-base font-bold text-foreground shadow-sm transition-all hover:bg-muted active:scale-95"
              >
                Get Legal Advice
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="sap-container py-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Main Content: Lawyer Listings */}
          <div className="lg:col-span-2 space-y-12">
            <section id="listings" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Featured Law Firms</h2>
                <span className="text-sm font-medium text-muted-foreground">{data.lawyers.length} Results</span>
              </div>
              <div className="space-y-6">
                {data.lawyers.map((lawyer, i) => (
                  <div key={i} className="sap-card glass-card">
                    <div className="sap-card-body">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-foreground">{lawyer.name}</h3>
                          <p className="text-sm font-semibold text-primary">{lawyer.specialization}</p>
                        </div>
                        {lawyer.website && (
                          <Link
                            href={lawyer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                          >
                            Visit Website
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {lawyer.description}
                      </p>
                      {lawyer.contact && (
                        <div className="flex items-center gap-2 pt-2 text-sm font-medium text-foreground">
                          <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {lawyer.contact}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQs */}
            <section id="faqs" className="space-y-8 pt-8">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
                <p className="text-sm text-muted-foreground">Everything you need to know about legal help in {data.city}</p>
              </div>
              <div className="grid gap-6">
                {[...data.faqs, ...COMMON_FAQS].map((faq, i) => (
                  <div key={i} className="sap-card">
                    <div className="sap-card-body">
                      <h4 className="font-bold text-foreground">{faq.question}</h4>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <aside className="sap-card bg-primary text-primary-foreground">
              <div className="sap-card-body space-y-4">
                <h3 className="text-lg font-bold">Are you a lawyer?</h3>
                <p className="text-sm opacity-90">
                  Manage your practice, track hearings, and stay organized with Lawyer Diary.
                </p>
                <Link
                  href="/sign-up"
                  className="inline-flex w-full min-h-[44px] items-center justify-center rounded-lg bg-white px-4 text-sm font-bold text-primary transition-all hover:bg-white/90"
                >
                  Start Free Trial
                </Link>
              </div>
            </aside>

            <aside className="sap-card">
              <div className="sap-card-body space-y-4">
                <h3 className="text-lg font-bold">Practice Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {data.practiceAreas.map((area, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </aside>

            <aside className="sap-card glass-card">
              <div className="sap-card-body space-y-4">
                <h3 className="text-lg font-bold text-foreground">Contact Support</h3>
                <p className="text-sm text-muted-foreground">
                  Need help choosing a lawyer? Our team can guide you to the right professional.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span>support@lawyerdiary.pk</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span>Mon - Sat: 9:00 AM - 6:00 PM</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
