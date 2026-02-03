"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  Banknote,
  MoreHorizontal,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: Briefcase },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/billing", label: "Billing", icon: Banknote },
  { href: "/settings", label: "More", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    if (href === "/settings") {
      // "More" is active if on settings or any page not in main nav
      return pathname === href || 
        !navItems.slice(0, -1).some(item => pathname === item.href || pathname.startsWith(`${item.href}/`));
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 px-2 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              aria-label={item.label}
            >
              <Icon className={cn(
                "h-5 w-5 sm:h-6 sm:w-6",
                active && "text-primary"
              )} />
              <span className={cn(
                "text-[10px] sm:text-xs font-medium truncate w-full text-center",
                active && "text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
