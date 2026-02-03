import type { ReactNode } from "react";
import Link from "next/link";
import { AppNav } from "@/components/layout/app-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BottomNav } from "@/components/layout/bottom-nav";

type NotificationSummary = {
  id: string;
  title: string;
  message?: string | null;
  link?: string | null;
  createdAt: string;
  readAt?: string | null;
};

type AppShellProps = {
  firmName?: string | null;
  notifications: NotificationSummary[];
  children: ReactNode;
};

export function AppShell({ firmName, notifications, children }: AppShellProps) {
  return (
    <div className="sap-shell flex min-h-screen bg-background text-foreground">
      {/* Sidebar for desktop */}
      <aside className="group hidden overflow-hidden border-r border-border/60 bg-card/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-[width] duration-200 ease-out md:flex md:w-[4.5rem] md:flex-col md:justify-between md:hover:w-64">
        <div className="flex flex-col flex-1 overflow-y-auto">
          <Link
            href="/dashboard"
            className="flex items-center justify-center px-3 py-3 sm:px-4 transition-opacity hover:opacity-80 group/logo"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-md opacity-0 group-hover/logo:opacity-100 transition-opacity" />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-black text-white shadow-lg shadow-blue-500/25">
                <span className="text-xs">UX</span>
                <span className="text-orange-400 text-xs">4</span>
                <span className="text-xs">U</span>
              </span>
            </div>
          </Link>
          <SidebarNav />
        </div>
        <div className="hidden md:block border-t border-border px-3 py-3 sm:px-4">
          <SignOutButton
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2.5 sm:gap-3 min-h-[44px] sm:min-h-[40px] text-sm"
          />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sap-shell-bar">
          <div className="sap-container flex flex-col gap-2.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-3">
            {/* Mobile brand + nav */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 md:hidden w-full">
              <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 shrink-0 transition-opacity hover:opacity-80 group/logo">
                <div className="relative">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-md opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-xs font-black text-white shadow-lg shadow-blue-500/25 sm:h-10 sm:w-10">
                    <span className="text-[10px]">UX</span>
                    <span className="text-orange-400 text-[10px]">4</span>
                    <span className="text-[10px]">U</span>
                  </span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                    Its 4 You
                  </p>
                  <span className="text-xs font-semibold text-foreground line-clamp-1 sm:text-sm">
                    {firmName ?? "Your practice"}
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <AppNav />
                <ThemeToggle />
                <NotificationBell notifications={notifications} />
              </div>
            </div>

            {/* Desktop header */}
            <div className="hidden md:flex md:flex-1 md:items-center">
              <form action="/search" className="w-full max-w-xl">
                <input
                  type="search"
                  name="q"
                  placeholder="Search cases, clients, invoices, CNR…"
                  className="w-full rounded-lg border border-input/60 bg-background/50 backdrop-blur-sm px-4 py-2 text-sm shadow-sm outline-none ring-0 transition-all duration-200 hover:border-primary/40 hover:bg-background/70 hover:shadow-md focus:border-primary/60 focus:ring-primary/20 focus:ring-2 focus:bg-background focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1),0_0_20px_rgba(59,130,246,0.15)]"
                />
              </form>
            </div>

            <div className="hidden items-center justify-end gap-3 md:flex md:flex-none">
              <ThemeToggle />
              <div className="relative">
                <NotificationBell notifications={notifications} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-4 sm:pb-6 md:pb-8">
          <div className="sap-container py-3 sm:py-4 md:py-5 lg:py-6">{children}</div>
        </main>
      </div>
      
      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  );
}

