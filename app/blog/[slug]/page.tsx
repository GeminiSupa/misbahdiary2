import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import fs from "node:fs";
import path from "node:path";
import {
  getBlogPost,
  getAllBlogSlugs,
  getAllBlogs,
  getLanguageRelatedBlogs,
  getCrossLanguageBlogs,
  inferBlogLanguage,
  type BlogListItem,
} from "@/lib/blog-posts";
import { LandingFooter } from "@/components/landing/landing-footer";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type Props = {
  params: Promise<{ slug: string }>;
};

const INTERNAL_PHRASE_PATTERNS = [
  { phrase: "case management system", routes: ["/cases"] },
  { phrase: "client management system", routes: ["/clients"] },
  { phrase: "legal document management", routes: ["/cases"] },
  { phrase: "court hearings", routes: ["/calendar"] },
  { phrase: "law firm software", routes: ["/blog"] },
] as const;

const AVAILABLE_ROUTES = getAvailableRoutes();

function getAvailableRoutes(): Set<string> {
  const routes = new Set<string>(["/"]);
  const appDir = path.join(process.cwd(), "app");

  if (!fs.existsSync(appDir)) {
    return routes;
  }

  const walk = (currentDir: string, segments: string[]) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    const hasPage = entries.some(
      (entry) =>
        entry.isFile() &&
        ["page.tsx", "page.ts", "page.jsx", "page.js"].includes(entry.name),
    );

    if (hasPage) {
      routes.add(segments.length === 0 ? "/" : `/${segments.join("/")}`);
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const segment = entry.name;
      const absolutePath = path.join(currentDir, segment);

      if (segment.startsWith("[")) continue;

      if (segment.startsWith("(") && segment.endsWith(")")) {
        walk(absolutePath, segments);
        continue;
      }

      walk(absolutePath, [...segments, segment]);
    }
  };

  walk(appDir, []);
  return routes;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getContextualLinkMap(
  availableRoutes: Set<string>,
): Array<{ phrase: string; href: string }> {
  const links: Array<{ phrase: string; href: string }> = [];

  for (const pattern of INTERNAL_PHRASE_PATTERNS) {
    const href = pattern.routes.find((route) =>
      availableRoutes.has(route),
    );

    if (href) {
      links.push({ phrase: pattern.phrase, href });
    }
  }

  return links;
}

const CONTEXTUAL_LINKS = getContextualLinkMap(AVAILABLE_ROUTES);

function injectContextualLinks(content: string, maxLinks = 5): string {
  if (CONTEXTUAL_LINKS.length === 0) return content;

  let inserted = 0;
  const anchorPattern = /(<a\b[^>]*>[\s\S]*?<\/a>)/gi;
  const parts = content.split(anchorPattern);

  return parts
    .map((part) => {
      if (inserted >= maxLinks) return part;
      if (/^<a\b/i.test(part)) return part;

      return part.replace(/>([^<]+)</g, (segment, text: string) => {
        if (inserted >= maxLinks) return segment;

        let updated = text;

        for (const link of CONTEXTUAL_LINKS) {
          if (inserted >= maxLinks) break;

          const regex = new RegExp(`\\b${escapeRegExp(link.phrase)}\\b`, "i");
          if (!regex.test(updated)) continue;

          updated = updated.replace(
            regex,
            (match) => `<a href="${link.href}">${match}</a>`,
          );
          inserted += 1;
        }

        return `>${updated}<`;
      });
    })
    .join("");
}

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: `${post.title} | Lawyer Diary Blog`,
    description: post.description,
    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | Lawyer Diary Blog`,
      description: post.description,
      url: `${baseUrl}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | Lawyer Diary Blog`,
      description: post.description,
      images: [post.image],
    },
  };
}

function SeoInternalLinks({
  relatedBlogs,
  crossLanguageBlogs,
  language,
}: {
  relatedBlogs: BlogListItem[];
  crossLanguageBlogs: BlogListItem[];
  language: "ur" | "en";
}) {
  const crossLanguageLabel = language === "en" ? "Read in Urdu" : "Read in English";

  if (relatedBlogs.length === 0 && crossLanguageBlogs.length === 0) return null;

  return (
    <aside className="mt-10 rounded-xl border border-black/10 bg-black/3 p-4 sm:mt-12 sm:p-6">
      {relatedBlogs.length > 0 && (
        <>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-black/60 sm:text-sm">
            Related Articles
          </h3>
          <ul className="space-y-3">
            {relatedBlogs.map((blog) => (
              <li key={blog.slug}>
                <Link
                  href={`/blog/${blog.slug}`}
                  className="block py-1 text-sm font-medium text-slate-800 transition hover:text-[#f97316] sm:text-base"
                >
                  {blog.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {crossLanguageBlogs.length > 0 && (
        <>
          <h3 className="mb-4 mt-8 text-xs font-semibold uppercase tracking-wider text-black/60 sm:text-sm">
            {crossLanguageLabel}
          </h3>
          <ul className="space-y-3">
            {crossLanguageBlogs.map((blog) => (
              <li key={blog.slug}>
                <Link
                  href={`/blog/${blog.slug}`}
                  className="block py-1 text-sm font-medium text-slate-800 transition hover:text-[#f97316] sm:text-base"
                >
                  {blog.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}

function BlogContent({ content }: { content: string }) {
  return (
    <article
      className="blog-content
      [&_h1]:mt-2 [&_h1]:mb-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-black sm:[&_h1]:text-3xl
      [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:leading-snug [&_h2]:text-black sm:[&_h2]:text-xl
      [&_h3]:mt-7 [&_h3]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-black sm:[&_h3]:text-lg
      [&_p]:mb-4 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-black/85 sm:[&_p]:text-base
      [&_strong]:font-semibold [&_strong]:text-black
      [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:pr-2 sm:[&_ul]:pl-6
      [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ol]:pr-2 sm:[&_ol]:pl-6
      [&_li]:text-[15px] [&_li]:leading-relaxed [&_li]:text-slate-800 sm:[&_li]:text-base
      [&_a]:font-medium [&_a]:text-[#f97316] [&_a]:underline-offset-2 [&_a]:no-underline [&_a]:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-[#f97316]/50 [&_a]:focus-visible:ring-offset-2 hover:[&_a]:underline
      [&_blockquote]:my-6 [&_blockquote]:rounded-xl [&_blockquote]:border [&_blockquote]:border-black/10 [&_blockquote]:bg-black/3 [&_blockquote]:p-4 sm:[&_blockquote]:p-5
      [&_blockquote_p]:mb-0 [&_blockquote_p]:text-black/80
      [&_hr]:my-10 [&_hr]:border-black/10
      [&_table]:my-7 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:rounded-xl [&_table]:border [&_table]:border-black/10 [&_table]:bg-white
      [&_thead]:block [&_tbody]:block
      [&_thead_tr]:grid [&_tbody_tr]:grid
      [&_thead_tr]:grid-cols-3 [&_tbody_tr]:grid-cols-3
      [&_thead_th]:bg-black/3 [&_thead_th]:px-3 [&_thead_th]:py-2.5 [&_thead_th]:text-left [&_thead_th]:text-xs [&_thead_th]:font-semibold [&_thead_th]:text-black/70 sm:[&_thead_th]:text-sm
      [&_tbody_td]:border-t [&_tbody_td]:border-black/10 [&_tbody_td]:px-3 [&_tbody_td]:py-2.5 [&_tbody_td]:align-top [&_tbody_td]:text-[14px] [&_tbody_td]:text-black/80 sm:[&_tbody_td]:text-[15px]"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const allBlogs = getAllBlogs();
  const currentBlog = allBlogs.find((blog) => blog.slug === slug);
  const language = currentBlog?.language ?? inferBlogLanguage(post);
  const relatedBlogs = getLanguageRelatedBlogs(slug, 3, 5);
  const crossLanguageBlogs = getCrossLanguageBlogs(slug, 2);
  const linkedContent = injectContextualLinks(post.content.trim(), 5);

  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: [`${baseUrl}${post.image}`],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Organization",
      name: "UX4U",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "UX4U",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/ux4u-logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
  };

  return (
    <>
      <Script
        id={`ld-blog-${post.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingLd) }}
      />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <Link
          href="/blog"
          className="mb-6 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-slate-700 transition hover:text-black"
          aria-label="Back to blog"
        >
          ← Back to Blog
        </Link>

        <article>
          <header className="mb-8 sm:mb-10">
            <div className="relative -mx-4 mb-6 aspect-video overflow-hidden rounded-lg sm:mx-0 sm:rounded-xl">
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                className="object-contain bg-white/80 p-6"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold leading-tight text-black sm:text-3xl md:text-4xl">
              {post.title}
            </h1>
            <time
              dateTime={post.publishedAt}
              className="mt-3 block text-sm text-slate-600"
            >
              {new Date(post.publishedAt).toLocaleDateString("en-PK", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </header>

          <BlogContent content={linkedContent} />

          <SeoInternalLinks
            relatedBlogs={relatedBlogs}
            crossLanguageBlogs={crossLanguageBlogs}
            language={language}
          />
        </article>

        <div className="mt-12 flex flex-col gap-4 border-t border-black/10 pt-10 sm:flex-row sm:items-center sm:gap-6">
          <Link
            href="/blog"
            className="order-2 min-h-[44px] items-center text-sm font-medium text-slate-700 transition hover:text-black sm:order-1 sm:flex"
          >
            More articles →
          </Link>
          <Link
            href="/sign-up"
            className="order-1 inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-lg bg-[#f97316] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#ea580c] active:scale-[0.98] sm:order-2"
          >
            Start Free Trial
          </Link>
        </div>
      </main>
      <LandingFooter />
    </>
  );
}
