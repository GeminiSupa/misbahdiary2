"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cases", label: "Cases" },
  { href: "/calendar", label: "Calendar" },
  { href: "/billing", label: "Billing" },
  { href: "/clients", label: "Clients" },
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
      <nav className="sap-pill-nav">
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
          </nav>
        </div>
      ) : null}
    </div>
  );
}

