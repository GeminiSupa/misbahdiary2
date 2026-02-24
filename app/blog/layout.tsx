"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/"
            className="flex min-h-[44px] min-w-[44px] items-center text-sm font-medium text-black/80 transition hover:text-black"
          >
            ← Lawyer Diary
          </Link>
          <Link href="/blog" className="shrink-0">
            <Image
              src="/ux4u-logo.png"
              alt="UX4U"
              width={80}
              height={28}
              className="h-7 w-auto"
              unoptimized
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-up"
              className="hidden min-h-[40px] items-center rounded-lg bg-[#f97316] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#ea580c] sm:inline-flex"
            >
              Start Free
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-black/70 transition hover:bg-black/5 sm:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-black/10 bg-white px-4 py-4 sm:hidden">
            <Link
              href="/sign-up"
              className="block w-full rounded-lg bg-[#f97316] py-3 text-center text-sm font-medium text-white transition hover:bg-[#ea580c]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start Free
            </Link>
            <Link
              href="/"
              className="mt-2 block rounded-lg py-2 text-center text-sm text-black/80"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
          </div>
        )}
      </header>
      {children}
    </div>
  );
}
