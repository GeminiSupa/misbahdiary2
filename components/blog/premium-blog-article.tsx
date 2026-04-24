import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Zap } from "lucide-react";
import type { BlogTocItem } from "@/lib/blog-content-utils";
import { splitBlogTitle } from "@/lib/blog-content-utils";
import { BlogShareActions } from "@/components/blog/blog-share-actions";

type Props = {
  title: string;
  description: string;
  publishedAt: string;
  authorLabel: string;
  badgeLabel: string;
  heroImageSrc: string;
  heroImageAlt: string;
  toc: BlogTocItem[];
  contentHtml: string;
  postUrl: string;
  dir?: "ltr" | "rtl";
  children?: React.ReactNode;
};

function PremiumBlogProse({ contentHtml, dir = "ltr" }: { contentHtml: string; dir?: "ltr" | "rtl" }) {
  return (
    <div
      dir={dir}
      className={[
        "premium-blog-prose max-w-none",
        "[&_h1]:mt-2 [&_h1]:mb-5 [&_h1]:text-2xl [&_h1]:font-black [&_h1]:leading-tight [&_h1]:text-slate-950 sm:[&_h1]:text-3xl",
        "[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:scroll-mt-32 [&_h2]:border-l-4 [&_h2]:border-teal-600 [&_h2]:pl-6 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-slate-950 sm:[&_h2]:text-3xl",
        "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:leading-snug [&_h3]:text-slate-900 sm:[&_h3]:text-xl",
        "[&_p]:mb-4 [&_p]:text-base [&_p]:font-medium [&_p]:leading-[1.8] [&_p]:text-slate-700 sm:[&_p]:text-lg",
        "[&_strong]:font-bold [&_strong]:text-slate-900",
        "[&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:pr-2 sm:[&_ul]:pl-6",
        "[&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:pr-2 sm:[&_ol]:pl-6",
        "[&_li]:text-base [&_li]:font-medium [&_li]:leading-[1.8] [&_li]:text-slate-700 sm:[&_li]:text-lg",
        "[&_a]:font-semibold [&_a]:text-teal-700 [&_a]:underline-offset-2 [&_a]:no-underline hover:[&_a]:underline",
        "[&_blockquote]:my-8 [&_blockquote]:rounded-4xl [&_blockquote]:border [&_blockquote]:border-teal-500/15 [&_blockquote]:bg-teal-500/5 [&_blockquote]:p-6 sm:[&_blockquote]:p-8",
        "[&_blockquote_p]:mb-0 [&_blockquote_p]:text-slate-800",
        "[&_hr]:my-10 [&_hr]:border-slate-200",
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: contentHtml }}
    />
  );
}

export function PremiumBlogArticle({
  title,
  description,
  publishedAt,
  authorLabel,
  badgeLabel,
  heroImageSrc,
  heroImageAlt,
  toc,
  contentHtml,
  postUrl,
  dir = "ltr",
  children,
}: Props) {
  const { first, accent } = splitBlogTitle(title);
  const formattedDate = new Date(publishedAt).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f8fafb] font-sans text-[#020617] selection:bg-[#005959] selection:text-white">
      <section className="relative isolate overflow-hidden bg-slate-950 pt-32 pb-16 text-white sm:pt-40 sm:pb-20">
        <div className="absolute inset-0 -z-10">
          <Image
            src={heroImageSrc}
            alt={heroImageAlt}
            fill
            className={
              /\.svg$/i.test(heroImageSrc)
                ? "object-contain object-center p-12 opacity-20 sm:p-20"
                : "object-cover opacity-20"
            }
            sizes="100vw"
            priority
            unoptimized={/\.svg$/i.test(heroImageSrc)}
          />
          {/* Stronger scrims for consistent contrast across all cover images */}
          <div className="absolute inset-0 bg-linear-to-b from-slate-950 via-slate-950/90 to-slate-950" />
          <div className="absolute inset-0 bg-slate-950/35" />
          <div className="absolute inset-0 bg-radial-[circle_at_50%_35%] from-slate-950/10 via-slate-950/55 to-slate-950/95" />
        </div>

        <div className="container mx-auto max-w-4xl px-6">
          <Link
            href="/blog"
            className="mb-10 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-100/90 shadow-[0_10px_30px_rgba(2,6,23,0.35)] backdrop-blur-md transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-teal-400" />
            Back to Blog
          </Link>

          <div className="text-center" dir={dir}>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/5 px-4 py-2">
              <Zap className="h-4 w-4 text-teal-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">
                {badgeLabel}
              </span>
            </div>

            <h1 className="mb-8 text-4xl font-black leading-[1.1] tracking-tighter md:text-6xl lg:text-7xl">
              {accent ? (
                <>
                  <span className="text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">{first}</span>
                  <br />
                  <span className="text-teal-300 italic [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">
                    {accent}
                  </span>
                </>
              ) : (
                <span className="text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">{first}</span>
              )}
            </h1>

            <div className="flex flex-col items-center justify-center gap-4 border-y border-white/10 py-6 text-xs font-bold uppercase tracking-widest text-slate-200/80 sm:flex-row sm:gap-6">
              <div className="flex items-center gap-2 italic">
                <Calendar className="h-4 w-4 text-teal-400" />
                <time dateTime={publishedAt}>{formattedDate}</time>
              </div>
              <div className="hidden h-4 w-px bg-white/10 sm:block" />
              <div className="flex items-center gap-2 italic">
                <User className="h-4 w-4 text-teal-400" />
                <span>{authorLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-12 lg:grid-cols-4">
          <aside className="hidden border-r border-slate-200 pr-8 lg:col-span-1 lg:block">
            <div className="sticky top-40 space-y-8">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                On this page
              </h2>
              {toc.length > 0 ? (
                <nav className="flex flex-col gap-4 text-sm font-bold text-slate-700">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="text-left transition-colors hover:text-teal-600"
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              ) : (
                <p className="text-sm font-medium text-slate-500">Sections follow below.</p>
              )}
            </div>
          </aside>

          <div className="space-y-12 lg:col-span-3">
            <div className="rounded-[3rem] border border-teal-500/10 bg-teal-500/5 p-8 shadow-2xl shadow-teal-500/5 sm:p-10">
              <p className="text-base font-bold leading-[1.8] text-slate-900 sm:text-lg">{description}</p>
            </div>

            <PremiumBlogProse contentHtml={contentHtml} dir={dir} />

            {children}

            <div className="relative space-y-8 overflow-hidden rounded-[3rem] bg-slate-950 p-10 text-white sm:p-12">
              <div className="relative z-10">
                <h2 className="mb-4 text-2xl font-black italic sm:text-3xl">Run your firm with clarity</h2>
                <p className="mb-8 text-base leading-relaxed text-slate-300 sm:text-lg">
                  Lawyer Diary brings matters, clients, billing, and hearings into one workspace built for
                  Pakistani firms.
                </p>
                <Link
                  href="/sign-up"
                  className="inline-flex h-14 min-h-[56px] items-center justify-center rounded-2xl bg-teal-500 px-10 text-base font-black text-white shadow-xl shadow-teal-500/20 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start free trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-16 text-center sm:py-20">
        <p className="mb-8 text-xs font-black uppercase tracking-widest text-slate-400">End of article</p>
        <div className="flex justify-center gap-4">
          <BlogShareActions url={postUrl} title={title} />
        </div>
      </footer>
    </div>
  );
}
