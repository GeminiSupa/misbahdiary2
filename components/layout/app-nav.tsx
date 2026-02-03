"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/cases", label: "Cases" },
  { href: "/calendar", label: "Calendar" },
  { href: "/billing", label: "Billing" },
  { href: "/messages", label: "Messages" },
  { href: "/activity", label: "Activity" },
  { href: "/subscription", label: "Subscription" },
  { href: "/contact", label: "Contact" },
  { href: "/user-manual", label: "User Manual" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex items-center gap-2">
      {/* Desktop horizontal nav - hidden on mobile */}
      <nav className="sap-pill-nav hidden md:flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn("sap-pill-nav-link", isActive(item.href) && "sap-pill-active")}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile hamburger menu - only visible on mobile */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {mobileOpen ? (
        <div className="fixed inset-x-0 top-[60px] z-50 max-h-[calc(100vh-60px)] overflow-y-auto border-b border-border/80 bg-card/98 backdrop-blur-sm px-4 py-4 shadow-xl md:hidden">
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={cn(
                  "block rounded-xl px-4 py-3.5 min-h-[44px] text-base font-medium transition active:scale-[0.98] sm:text-sm sm:min-h-[40px]",
                  isActive(item.href)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground active:bg-accent",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-border/60">
              <SignOutButton
                variant="ghost"
                size="default"
                className="w-full justify-start px-4 py-3.5 min-h-[44px] text-base sm:text-sm sm:min-h-[40px]"
              />
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

