import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBlogPost,
  getAllBlogSlugs,
  getRelatedPosts,
  type BlogPost,
} from "@/lib/blog-posts";
import { LandingFooter } from "@/components/landing/landing-footer";

type Props = {
  params: Promise<{ slug: string }>;
};

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
  };
}

function RelatedPosts({ currentSlug }: { currentSlug: string }) {
  const related = getRelatedPosts(currentSlug, 3);
  if (related.length === 0) return null;
  return (
    <aside className="mt-10 rounded-xl border border-black/10 bg-black/3 p-4 sm:mt-12 sm:p-6">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-black/60 sm:text-sm">
        Related guides
      </h3>
      <ul className="space-y-3">
        {related.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="block py-1 text-sm font-medium text-black/85 transition hover:text-[#f97316] sm:text-base"
            >
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function BlogContent({ post }: { post: BlogPost }) {
  return (
    <article
      className="blog-content [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-black [&_h2]:sm:text-xl [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:sm:text-lg [&_p]:mb-4 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-black/85 [&_p]:sm:text-base [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:pr-2 [&_ul]:sm:pl-6 [&_li]:text-[15px] [&_li]:sm:text-base [&_a]:font-medium [&_a]:text-[#f97316] [&_a]:underline-offset-2 [&_a]:no-underline [&_a]:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-[#f97316]/50 [&_a]:focus-visible:ring-offset-1 hover:[&_a]:underline"
      dangerouslySetInnerHTML={{ __html: post.content.trim() }}
    />
  );
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <>
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <Link
          href="/blog"
          className="mb-6 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-black/70 transition hover:text-black"
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
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold leading-tight text-black sm:text-3xl md:text-4xl">
              {post.title}
            </h1>
            <time
              dateTime={post.publishedAt}
              className="mt-3 block text-sm text-black/50"
            >
              {new Date(post.publishedAt).toLocaleDateString("en-PK", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </header>

          <BlogContent post={post} />
        </article>

        <RelatedPosts currentSlug={slug} />

        <div className="mt-12 flex flex-col gap-4 border-t border-black/10 pt-10 sm:flex-row sm:items-center sm:gap-6">
          <Link
            href="/blog"
            className="order-2 min-h-[44px] items-center text-sm font-medium text-black/70 transition hover:text-black sm:order-1 sm:flex"
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
