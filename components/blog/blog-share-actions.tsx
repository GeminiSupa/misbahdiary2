"use client";

import { Share2 } from "lucide-react";
import { useCallback, useState } from "react";

type Props = {
  url: string;
  title: string;
};

export function BlogShareActions({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled or share failed */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [title, url]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={share}
        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 transition-all hover:border-teal-500/30 hover:bg-teal-600 hover:text-white"
        aria-label={copied ? "Link copied" : "Share or copy link"}
      >
        <Share2 className="h-6 w-6" />
      </button>
      {copied ? (
        <span className="text-xs font-semibold text-teal-600">Copied</span>
      ) : null}
    </div>
  );
}
