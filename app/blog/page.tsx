import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BLOG_POSTS } from "@/lib/blog-posts";
import { LandingFooter } from "@/components/landing/landing-footer";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://www.vakeeldiary.com";

export const metadata: Metadata = {
  title: "Blog – Guides for Pakistani Advocates | Lawyer Diary",
  description:
    "Practical guides on e-filing, invoicing, court management, and legal practice for law firms in Pakistan. From Lawyer Diary.",
  alternates: {
    canonical: `${baseUrl}/blog`,
  },
  openGraph: {
    title: "Blog – Guides for Pakistani Advocates | Lawyer Diary",
    description:
      "Practical guides on e-filing, invoicing, court management, and legal practice for law firms in Pakistan. From Lawyer Diary.",
    url: `${baseUrl}/blog`,
    type: "website",
    images: [
      {
        url: "/images/blog/online.svg",
        width: 1200,
        height: 630,
        alt: "Lawyer Diary blog guides for Pakistani advocates",
      },
    ],
  },
};

export default function BlogPage() {
  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-10 sm:mb-14">
          <h1 className="text-2xl font-bold text-black sm:text-3xl md:text-4xl">
            Blog & Guides
          </h1>
          <p className="mt-2 text-base text-slate-700 sm:text-lg">
            Practical guides for Pakistani advocates—e-filing, billing, court
            management, and more.
          </p>
        </header>

        <ul className="space-y-6 sm:space-y-8">
          {BLOG_POSTS.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-white transition hover:border-[#f97316]/30 hover:shadow-md sm:flex-row"
              >
                <div className="relative h-40 w-full shrink-0 sm:h-36 sm:w-48">
                  <Image
                    src={post.image}
                    alt={post.imageAlt}
                    fill
                    className="object-contain bg-white/80 p-3 transition group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 192px"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-center p-4 sm:p-5">
                  <h2 className="text-lg font-semibold text-black transition group-hover:text-[#f97316] sm:text-xl">
                    {post.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate-700 sm:text-base">
                    {post.description}
                  </p>
                  <time
                    dateTime={post.publishedAt}
                    className="mt-2 block text-xs text-slate-600 sm:text-sm"
                  >
                    {new Date(post.publishedAt).toLocaleDateString("en-PK", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-xl border border-black/10 bg-linear-to-br from-black/5 to-black/2 p-6 text-center sm:mt-16 sm:p-8">
          <p className="mb-4 text-base font-medium text-black sm:text-lg">
            Ready to streamline your practice?
          </p>
          <Link
            href="/sign-up"
            className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-lg bg-[#f97316] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#ea580c] active:scale-[0.98]"
          >
            Start Lawyer Diary Free
          </Link>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
