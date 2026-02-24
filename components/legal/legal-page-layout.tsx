import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LandingFooter } from "@/components/landing/landing-footer";

type LegalPageLayoutProps = {
  title: string;
  lastUpdated: string;
  toc?: { id: string; label: string }[];
  children: React.ReactNode;
};

export function LegalPageLayout({
  title,
  lastUpdated,
  toc = [],
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-black/80 transition hover:text-black"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Lawyer Diary
          </Link>
          <Link href="/" className="shrink-0">
            <Image
              src="/ux4u-logo.png"
              alt="UX4U"
              width={80}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 pt-8 lg:flex-row lg:gap-12">
          {/* Table of Contents - Desktop */}
          {toc.length > 0 && (
            <aside className="hidden shrink-0 lg:block lg:w-56">
              <nav className="sticky top-24">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-black/50">
                  On this page
                </p>
                <ul className="space-y-2">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block text-sm text-black/70 underline-offset-4 transition hover:text-black hover:underline"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}

          {/* Main content */}
          <article className="min-w-0 flex-1">
            <header className="mb-8">
              <h1 className="text-2xl font-bold text-black sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 text-sm text-black/60">
                Last updated: {lastUpdated}
              </p>
            </header>

            <div className="space-y-5 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-black [&_p]:text-black/85 [&_p]:leading-relaxed [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:text-black/85 [&_li]:leading-relaxed [&_a]:text-[#E9730C] [&_a]:underline-offset-4 hover:[&_a]:underline">
              {children}
            </div>
          </article>
        </div>
      </div>

      <LandingFooter variant="legal" />
    </div>
  );
}
