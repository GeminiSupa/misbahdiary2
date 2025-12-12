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
      <aside className="group hidden overflow-hidden border-r bg-card/95 transition-[width] duration-200 ease-out md:flex md:w-[4.5rem] md:flex-col md:justify-between md:hover:w-64">
        <div>
          <div className="flex items-center justify-center px-4 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-sm">
              LD
            </span>
          </div>
          <SidebarNav />
        </div>
        <div className="border-t px-4 py-4">
          <SignOutButton
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sap-shell-bar border-b bg-card/90 backdrop-blur">
          <div className="sap-container flex flex-col gap-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3">
            {/* Mobile brand + nav */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 md:hidden">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm sm:h-10 sm:w-10 sm:text-base">
                  LD
                </span>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-primary/70 sm:text-[10px] sm:tracking-[0.28em]">
                    Lawyer Diary
                  </p>
                  <span className="text-xs font-semibold text-foreground line-clamp-1 sm:text-sm">
                    {firmName ?? "Your practice"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <TimerControl />
                <NotificationBell notifications={notifications} />
                <SignOutButton variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" />
                <AppNav />
              </div>
            </div>

            {/* Desktop header */}
            <div className="hidden md:flex md:flex-1 md:items-center">
              <form action="/search" className="w-full max-w-xl">
                <input
                  type="search"
                  name="q"
                  placeholder="Search cases, clients, invoices, CNR…"
                  className="w-full rounded-full border border-input bg-background px-4 py-2 text-sm shadow-sm outline-none ring-0 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </form>
            </div>

            <div className="hidden items-center justify-end gap-2 md:flex md:flex-none">
              <TimerControl />
              <NotificationBell notifications={notifications} />
            </div>
          </div>
        </header>

        <main className="flex-1 pb-6 sm:pb-8 md:pb-12">
          <div className="sap-container py-4 sm:py-6 md:py-8 lg:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

