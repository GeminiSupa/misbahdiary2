/**
 * Prepare CMS-style HTML for the premium blog layout: single page <h1> in the hero,
 * table of contents anchors on <h2>, optional removal of the first in-body <h1>.
 */

export type BlogTocItem = { id: string; text: string };

function slugifyHeading(text: string, index: number): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "");
  return `${base || "section"}-${index}`;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

/** Pull plain text from the first <h2>…</h2> in order. */
export function extractH2Toc(html: string): BlogTocItem[] {
  const re = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
  const items: BlogTocItem[] = [];
  let m: RegExpExecArray | null;
  let index = 0;
  while ((m = re.exec(html)) !== null) {
    const text = stripTags(m[1]);
    if (!text) continue;
    items.push({ id: slugifyHeading(text, index), text });
    index += 1;
  }
  return items;
}

/** Add stable ids to each <h2> in document order (skips h2 that already have id). */
export function injectH2Ids(html: string, toc: BlogTocItem[]): string {
  let i = 0;
  return html.replace(/<h2(\b[^>]*)>/gi, (full, attrs: string) => {
    if (/\bid\s*=/i.test(attrs)) return full;
    const item = toc[i];
    i += 1;
    if (!item) return full;
    return `<h2 id="${item.id}"${attrs}>`;
  });
}

export function stripFirstH1(html: string): string {
  return html.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/i, "").trim();
}

export function preparePremiumBlogHtml(html: string): {
  html: string;
  toc: BlogTocItem[];
} {
  const withoutH1 = stripFirstH1(html);
  const toc = extractH2Toc(withoutH1);
  const withIds = injectH2Ids(withoutH1, toc);
  return { html: withIds, toc };
}

/** Split title for hero typography (accent line when a natural break exists). */
export function splitBlogTitle(title: string): { first: string; accent: string | null } {
  const colon = title.indexOf(":");
  if (colon > 0 && colon < title.length - 1) {
    return {
      first: title.slice(0, colon).trim(),
      accent: title.slice(colon + 1).trim(),
    };
  }
  const emDash = title.indexOf(" — ");
  if (emDash > 0) {
    return {
      first: title.slice(0, emDash).trim(),
      accent: title.slice(emDash + 3).trim(),
    };
  }
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length <= 4) {
    return { first: title, accent: null };
  }
  const mid = Math.ceil(words.length / 2);
  return {
    first: words.slice(0, mid).join(" "),
    accent: words.slice(mid).join(" "),
  };
}
