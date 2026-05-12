"use client";

import { useEffect, useRef } from "react";

const defaultClient =
  process.env.NEXT_PUBLIC_ADSENSE_PUB_ID || "ca-pub-4731703376366094";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSenseDisplayUnitProps = {
  /** Ad unit slot ID from AdSense */
  adSlot: string;
  /** Optional wrapper classes */
  className?: string;
  /** Override publisher client id (defaults to NEXT_PUBLIC_ADSENSE_PUB_ID) */
  adClient?: string;
};

/**
 * Single responsive display unit. Loads only the `<ins>` + push;
 * root `layout.tsx` must include `adsbygoogle.js` once.
 */
export function AdSenseDisplayUnit({
  adSlot,
  className,
  adClient = defaultClient,
}: AdSenseDisplayUnitProps) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      pushedRef.current = false;
    }
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
