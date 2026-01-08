import type { ReactNode } from "react";
import { AppNav } from "@/components/layout/app-nav";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { TimerControl } from "@/components/layout/timer-control";

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
      <aside className="group hidden overflow-hidden border-r border-border bg-card shadow-sm transition-[width] duration-200 ease-out md:flex md:w-[4.5rem] md:flex-col md:justify-between md:hover:w-64">
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex items-center justify-center px-3 py-3 sm:px-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
              LD
            </span>
          </div>
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
        <header className="sap-shell-bar border-b border-border bg-card">
          <div className="sap-container flex flex-col gap-2.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-3">
            {/* Mobile brand + nav */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 md:hidden">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground shadow-sm sm:h-10 sm:w-10 sm:text-sm">
                  LD
                </span>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                    Lawyer Diary
                  </p>
                  <span className="text-xs font-semibold text-foreground line-clamp-1 sm:text-sm">
                    {firmName ?? "Your practice"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <TimerControl />
                <AppNav />
                <div className="flex items-center">
                  <NotificationBell notifications={notifications} />
                </div>
              </div>
            </div>

            {/* Desktop header */}
            <div className="hidden md:flex md:flex-1 md:items-center">
              <form action="/search" className="w-full max-w-xl">
                <input
                  type="search"
                  name="q"
                  placeholder="Search cases, clients, invoices, CNR…"
                  className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </form>
            </div>

            <div className="hidden items-center justify-end gap-3 md:flex md:flex-none">
              <TimerControl />
              <div className="relative">
                <NotificationBell notifications={notifications} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-4 sm:pb-6 md:pb-8">
          <div className="sap-container py-3 sm:py-4 md:py-5 lg:py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

