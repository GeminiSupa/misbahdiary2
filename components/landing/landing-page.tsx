"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  Banknote,
  CalendarDays,
  Scale,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Prata } from "next/font/google";
import { LandingFooter } from "@/components/landing/landing-footer";

const prata = Prata({
  subsets: ["latin"],
  weight: "400",
  fallback: ["Georgia", "serif"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "UX4U",
    url: baseUrl,
    logo: `${baseUrl}/ux4u-logo.png`,
    email: "info@ux4u.online",
    address: {
      "@type": "PostalAddress",
      streetAddress: "I 16/3 Service Road East",
      addressLocality: "Islamabad",
      addressCountry: "PK",
    },
    sameAs: [
      "https://www.facebook.com/ux4u.erpsolutions",
      "https://www.linkedin.com/company/ux4u-erp/?viewAsMember=true",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lawyer Diary",
    url: baseUrl,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Lawyer Diary",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: baseUrl,
    description:
      "Legal practice management software for Pakistani law firms and solo practitioners. Case management, billing, calendar, and hearing scheduling.",
    image: `${baseUrl}/lawyer-diary-dashboard.png`,
    publisher: {
      "@type": "Organization",
      name: "UX4U",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/ux4u-logo.png`,
      },
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "PKR",
    },
  },
];

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "#for-solo", label: "For Solo" },
  { href: "#for-firms", label: "For Firms" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "/sign-in", label: "Sign In" },
];

const features = [
  {
    icon: Briefcase,
    title: "Case & Matter Management",
    description:
      "Track clients, matters, court details, and case history in one place. Built for Pakistani law firms.",
    metric: "One central workspace",
  },
  {
    icon: Banknote,
    title: "Billing & Invoicing",
    description:
      "Generate invoices, record payments, and manage time entries. Invoicing and payment tracking for Pakistani law firms.",
    metric: "Save 12+ hours/week",
  },
  {
    icon: CalendarDays,
    title: "Calendar & Hearings",
    description:
      "Schedule hearings, chamber meetings, and deadlines. Stay on top of court dates.",
    metric: "Never miss a hearing",
  },
  {
    icon: Scale,
    title: "Practice Management",
    description:
      "Team collaboration, document storage, and workflow for firms of any size.",
    metric: "Scale with your firm",
  },
];

const productScreenshots = [
  { src: "/screenshots/Dashboard.png", label: "Dashboard" },
  { src: "/screenshots/Matters.png", label: "Matters" },
  { src: "/screenshots/CalenderAndHearing.png", label: "Hearing Calendar" },
  { src: "/screenshots/ClientProfiles.png", label: "Client Profiles" },
  { src: "/screenshots/BillingAndFinance.png", label: "Billing & Finance" },
  { src: "/screenshots/ActivityLogs.png", label: "Activity Logs" },
  { src: "/screenshots/TeamMessages.png", label: "Team Messages" },
];

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroCards, setHeroCards] = useState(productScreenshots.slice(0, 5));
  const pointerStartXRef = useRef<number | null>(null);
  const swipeTriggeredRef = useRef(false);

  const cycleHeroCards = () => {
    setHeroCards((prev) => {
      if (prev.length < 2) return prev;
      return [...prev.slice(1), prev[0]];
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartXRef.current = event.clientX;
    swipeTriggeredRef.current = false;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartXRef.current === null) return;

    const deltaX = event.clientX - pointerStartXRef.current;
    pointerStartXRef.current = null;

    if (Math.abs(deltaX) > 30) {
      swipeTriggeredRef.current = true;
      cycleHeroCards();
    }
  };

  const handleCardClick = () => {
    if (swipeTriggeredRef.current) {
      swipeTriggeredRef.current = false;
      return;
    }

    cycleHeroCards();
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className={`${prata.className} min-h-screen overflow-x-hidden bg-white [&_h1]:font-normal [&_h1]:leading-tight [&_h2]:font-normal [&_h2]:leading-tight [&_h3]:font-normal [&_h3]:leading-[1.3] [&_p]:leading-[1.65]`}>
        {/* Sticky Top Navigation */}
        <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-md">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image
                src="/ux4u-logo.png"
                alt="UX4U"
                width={130}
                height={46}
                className="h-8 w-auto sm:h-9"
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-black/80 transition hover:bg-black/5 hover:text-black"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/sign-up"
                className="ml-2 inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-xl bg-[#f97316] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea580c] active:scale-[0.98]"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link
                href="/sign-up"
                className="inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-xl bg-[#f97316] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ea580c] active:scale-[0.98]"
              >
                Start Trial
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-black/80 transition hover:bg-black/10"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="border-t border-black/10 bg-white px-4 py-4 lg:hidden">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="rounded-lg px-4 py-3 text-sm font-medium text-black/80 hover:bg-black/5"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Hero Section - Split Layout */}
        <section
          id="hero"
          className="relative overflow-hidden border-b border-black/10 bg-slate-50/50"
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)
              `,
              backgroundSize: "50px 50px",
            }}
          />
          <div className="absolute -top-40 -right-40 hidden h-80 w-80 rounded-full bg-orange-500/10 blur-3xl md:block" />
          <div className="absolute -bottom-40 -left-40 hidden h-80 w-80 rounded-full bg-[#047857]/10 blur-3xl md:block" />

          <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:py-16 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
              {/* Left: Headline + CTAs */}
              <div className="text-center lg:text-left">
                <h1 className="text-balance text-2xl font-normal leading-tight tracking-normal text-black sm:text-3xl md:text-4xl lg:text-5xl xl:text-[2.75rem]">
                  Lawyer Diary for Pakistani Advocates
                  <span className="block text-[#047857]">Cases, hearings, billing—organized.</span>
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-pretty text-base text-black/80 sm:text-lg lg:mx-0">
                  One workspace for cases, clients, court dates, and billing.
                  Built for how law firms operate in Pakistan.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <Link
                    href="/sign-up"
                    className="inline-flex min-h-[48px] items-center justify-center whitespace-nowrap rounded-xl bg-[#f97316] px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-[#ea580c] active:scale-[0.98] sm:w-auto"
                  >
                    Start Free Trial
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href="/sign-in"
                    className="inline-flex min-h-[48px] items-center justify-center whitespace-nowrap rounded-xl border border-black/20 bg-white px-6 py-3 text-base font-semibold text-black shadow-sm transition hover:bg-black/5 active:scale-[0.98] sm:w-auto"
                  >
                    Sign In
                  </Link>
                </div>
                <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2 lg:mx-0 lg:justify-start">
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70">
                    PKR invoicing
                  </span>
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70">
                    Hearing reminders
                  </span>
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70">
                    Team access for firms
                  </span>
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-black/70">
                    No credit card
                  </span>
                </div>
              </div>

              {/* Right: Swipeable product screenshots */}
              <div className="flex justify-center lg:justify-end">
                <div
                  className="relative h-[250px] w-[320px] select-none sm:h-[320px] sm:w-[500px]"
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={() => {
                    pointerStartXRef.current = null;
                  }}
                  onClick={handleCardClick}
                >
                  {heroCards.map((item, index) => {
                    const scale = Math.max(0.9, 1 - index * 0.03);
                    const opacity = Math.max(0.7, 1 - index * 0.08);
                    return (
                    <article
                      key={item.src}
                      className="absolute left-0 top-0 h-[220px] w-[300px] rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:h-[280px] sm:w-[420px] sm:p-4"
                      style={{
                        transform: `translateX(${index * 20}px) translateY(${index * 10}px) rotate(${index * -2}deg) scale(${scale})`,
                        zIndex: heroCards.length - index,
                        opacity,
                      }}
                    >
                      <span className="absolute left-4 top-4 rounded-md border border-black/10 bg-white/90 px-2 py-1 text-xs text-black/70">
                        {item.label}
                      </span>
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-white pt-7 sm:pt-8">
                        <Image
                          src={item.src}
                          alt={`${item.label} screenshot`}
                          width={900}
                          height={600}
                          className="h-full w-full object-contain"
                          draggable={false}
                        />
                      </div>
                    </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section - 2x2 with hover and metrics */}
        <section
          id="features"
          className="border-b border-black/10 bg-white py-16 sm:py-20 lg:py-24"
        >
          <div className="mx-auto max-w-6xl px-4">
            <h2 className={`${prata.className} text-center text-2xl font-normal leading-tight tracking-normal text-black sm:text-3xl`}>
              Everything You Need to Run Your Practice
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base text-black/70">
              Lawyer Diary helps Pakistani advocates and law firms manage
              clients, cases, billing, and hearings efficiently.
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:gap-8">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-xl border border-black/10 bg-slate-50 p-6 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:border-[#E9730C]/40 hover:shadow-xl hover:shadow-orange-500/10 lg:p-8"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E9730C]/20">
                      <Icon className="h-6 w-6 text-[#f97316]" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-[#f97316]">
                      {feature.metric}
                    </p>
                    <h3 className={`${prata.className} mt-2 font-normal leading-[1.3] tracking-normal text-black`}>
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-black/70">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Social Proof / Trust Section */}
        <section
          id="testimonials"
          className="border-b border-black/10 bg-slate-50/50 py-16 sm:py-20 lg:py-24"
        >
          <div className="mx-auto max-w-6xl px-4">
            <h2 className={`${prata.className} text-center text-2xl font-normal leading-tight tracking-normal text-black sm:text-3xl`}>
              Trusted by Advocates Across Pakistan
            </h2>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-black/60">
              <p className="flex items-center gap-2 text-sm">
                <span className="text-2xl font-bold text-[#047857]">450+</span>
                advocates in Lahore & Karachi
              </p>
              <p className="flex items-center gap-2 text-sm">
                <span className="text-2xl font-bold text-[#047857]">Local</span>
                currency support
              </p>
              <p className="flex items-center gap-2 text-sm">
                <span className="text-2xl font-bold text-[#047857]">Free</span>
                trial, no credit card
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-3xl">
              <blockquote className="rounded-xl border border-black/10 bg-white p-6 shadow-lg sm:p-8">
                <p className="text-base italic text-black/90 sm:text-lg">
                  &ldquo;Lawyer Diary streamlined our case management. We cut
                  billing time by half and never miss a court date. Built for
                  how we actually work in Pakistan.&rdquo;
                </p>
                <footer className="mt-4 text-sm text-black/60">
                  Adv Ali Hassan from Lahore
                </footer>
              </blockquote>
            </div>
          </div>
        </section>

        {/* For Solo / For Firms - Quick sections */}
        <section
          id="for-solo"
          className="border-b border-black/10 bg-white py-12 sm:py-16"
        >
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-10 md:grid-cols-2">
              <div className="rounded-xl border border-black/10 bg-slate-50 p-6">
                <h3 className={`${prata.className} text-lg font-normal leading-[1.3] tracking-normal text-black`}>
                  For Solo Practitioners
                </h3>
                <p className="mt-2 text-sm text-black/70">
                  One login, one workspace. Manage clients, cases, and billing
                  without overhead. Start free today.
                </p>
              </div>
              <div className="rounded-xl border border-black/10 bg-slate-50 p-6">
                <h3 className={`${prata.className} text-lg font-normal leading-[1.3] tracking-normal text-black`}>
                  For Law Firms
                </h3>
                <p className="mt-2 text-sm text-black/70">
                  Team collaboration, role-based access, and firm-wide
                  reporting. Scale from 2 to 10+ advocates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Teaser */}
        <section
          id="pricing"
          className="border-b border-black/10 bg-slate-50/50 py-16 sm:py-20"
        >
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className={`${prata.className} text-2xl font-normal leading-tight tracking-normal text-black sm:text-3xl`}>
              Built for Pakistani Legal Practice
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-black/70">
              Local invoicing, court structures, and workflows designed
              for advocates and firms across Pakistan. Start with a free trial
              no credit card required.
            </p>
            <Link
              href="/sign-up"
              className="mt-8 inline-flex min-h-[48px] items-center whitespace-nowrap rounded-xl bg-[#f97316] px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#ea580c] active:scale-[0.98]"
            >
              Get started
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>

            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-black/10 bg-white p-5 text-left shadow-sm">
              <p className="text-sm font-semibold text-black">Talk to UX4U</p>
              <div className="mt-2 grid gap-2 text-sm text-black/70 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-black/40">Address</p>
                  <p className="mt-1">I 16/3 Service Road East Islamabad</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-black/40">Email</p>
                  <a className="mt-1 inline-block hover:text-[#E9730C] hover:underline" href="mailto:info@ux4u.online">
                    info@ux4u.online
                  </a>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-black/40">WhatsApp</p>
                  <a
                    className="mt-1 inline-block hover:text-[#E9730C] hover:underline"
                    href="https://wa.me/923490554719"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +92 349 0554719
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <LandingFooter variant="landing" />
      </div>
    </>
  );
}
