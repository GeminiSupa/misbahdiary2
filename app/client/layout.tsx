import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-sm font-semibold">Client portal</span>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/client/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/client/messages" className="text-muted-foreground hover:text-foreground">
              Messages
            </Link>
            <SignOutButton
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-muted-foreground hover:text-foreground"
            />
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
