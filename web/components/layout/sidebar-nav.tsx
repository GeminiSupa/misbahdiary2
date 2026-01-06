"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  Banknote,
  Users,
  Settings as SettingsIcon,
  Clock,
  Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "primary" },
  { href: "/cases", label: "Cases", icon: Briefcase, color: "primary" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, color: "warning" },
  { href: "/time-tracking", label: "Time Tracking", icon: Clock, color: "info" },
  { href: "/billing", label: "Billing", icon: Banknote, color: "success" },
  { href: "/clients", label: "Clients", icon: Users, color: "info" },
  { href: "/ai-assistant", label: "AI Assistant", icon: Sparkles, color: "primary" },
  { href: "/settings", label: "Settings", icon: SettingsIcon, color: "muted" },
];

export function SidebarNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="space-y-1 px-2 py-2 sm:px-3 sm:py-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 sm:gap-3 rounded-lg px-2.5 py-2 sm:px-3 sm:py-2.5 text-sm font-medium transition-all min-h-[44px] sm:min-h-[40px]",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground active:bg-muted",
            )}
          >
            <Icon className={cn(
              "h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0",
              active && "text-primary-foreground"
            )} />
            <span className="truncate opacity-0 md:group-hover:opacity-100 md:group-hover:inline hidden md:inline">{item.label}</span>
            <span className="truncate md:hidden">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}



