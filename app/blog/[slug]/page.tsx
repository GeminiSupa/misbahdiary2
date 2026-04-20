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
  absoluteBlogImageUrl,
  type BlogListItem,
} from "@/lib/blog-posts";
import { preparePremiumBlogHtml } from "@/lib/blog-content-utils";
import { PremiumBlogArticle } from "@/components/blog/premium-blog-article";
import { LandingFooter } from "@/components/landing/landing-footer";
import { cn } from "@/lib/utils";

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
          url: absoluteBlogImageUrl(post.image, baseUrl),
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
      images: [absoluteBlogImageUrl(post.image, baseUrl)],
    },
  };
}

function SeoInternalLinks({
  relatedBlogs,
  crossLanguageBlogs,
  language,
  className,
}: {
  relatedBlogs: BlogListItem[];
  crossLanguageBlogs: BlogListItem[];
  language: "ur" | "en";
  className?: string;
}) {
  const crossLanguageLabel = language === "en" ? "Read in Urdu" : "Read in English";

  if (relatedBlogs.length === 0 && crossLanguageBlogs.length === 0) return null;

  return (
    <aside
      className={cn(
        "mt-10 rounded-xl border border-black/10 bg-black/3 p-4 sm:mt-12 sm:p-6",
        className,
      )}
    >
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
  const { html: premiumHtml, toc } = preparePremiumBlogHtml(linkedContent);
  const badgeLabel =
    post.badgeLabel ?? `Insights ${new Date(post.publishedAt).getFullYear()}`;
  const authorLabel = post.author ?? "Lawyer Diary";

  const postUrl = `${baseUrl}/blog/${post.slug}`;
  const blogPostingLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: [absoluteBlogImageUrl(post.image, baseUrl)],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: post.author
      ? { "@type": "Person", name: post.author }
      : {
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
      <main>
        <PremiumBlogArticle
          title={post.title}
          description={post.description}
          publishedAt={post.publishedAt}
          authorLabel={authorLabel}
          badgeLabel={badgeLabel}
          heroImageSrc={post.image}
          heroImageAlt={post.imageAlt}
          toc={toc}
          contentHtml={premiumHtml}
          postUrl={postUrl}
          dir={language === "ur" ? "rtl" : "ltr"}
        >
          <SeoInternalLinks
            relatedBlogs={relatedBlogs}
            crossLanguageBlogs={crossLanguageBlogs}
            language={language}
            className="mt-0 rounded-4xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
          />
        </PremiumBlogArticle>
      </main>
      <LandingFooter />
    </>
  );
}
