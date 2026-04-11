"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, KeyRound } from "lucide-react";

type ClientPortalAccessSheetProps = {
  clientId: string;
  clientEmail: string | null | undefined;
  canSetPortalPassword: boolean;
};

/**
 * Compact portal setup for the client profile: set password (or opt into login email) and enable access.
 */
export function ClientPortalAccessSheet({
  clientId,
  clientEmail,
  canSetPortalPassword,
}: ClientPortalAccessSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sendMagicLink, setSendMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailOk = Boolean(clientEmail?.trim());

  const handleEnable = async () => {
    setError(null);
    setMessage(null);
    const p = password.trim();
    const c = confirm.trim();

    if (!emailOk) {
      setError("Add a valid email on the client record first (Edit client).");
      return;
    }

    if (!sendMagicLink) {
      if (!p || !c || p !== c) {
        setError(
          "Enter a matching portal password (min. 8 characters), or enable “Also email login link”.",
        );
        return;
      }
    } else if (p || c) {
      if (!p || !c || p !== c) {
        setError("Password and confirmation must match.");
        return;
      }
    }

    setLoading(true);
    try {
      const body =
        sendMagicLink && !(p && c && p === c)
          ? { sendMagicLink: true as const }
          : { password: p, sendMagicLink };
      const res = await fetch(`/api/lawyer/clients/${clientId}/enable-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        throw new Error(payload.message || "Could not enable portal.");
      }
      setMessage(payload.message ?? "Client portal enabled.");
      setPassword("");
      setConfirm("");
      setSendMagicLink(false);
      router.refresh();
      setTimeout(() => setOpen(false), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable portal.");
    } finally {
      setLoading(false);
    }
  };

  if (!canSetPortalPassword) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="secondary" size="sm" className="w-full sm:w-auto">
          <KeyRound className="mr-2 h-4 w-4 shrink-0" />
          <span className="whitespace-nowrap">Portal access</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Client portal access</SheetTitle>
          <p className="text-sm text-muted-foreground text-left font-normal">
            The client only sees their own matters and hearings. Share the login email and password securely, or send a
            one-time login email.
          </p>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Login email</p>
            <p className="text-sm font-medium">{emailOk ? clientEmail : "— add email in Edit client —"}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="portal-sheet-pw">
                Portal password
              </label>
              <Input
                id="portal-sheet-pw"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="portal-sheet-pw2">
                Confirm
              </label>
              <Input
                id="portal-sheet-pw2"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat"
                className="h-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="portal-sheet-ml" checked={sendMagicLink} onCheckedChange={(v) => setSendMagicLink(v === true)} />
            <label htmlFor="portal-sheet-ml" className="text-xs text-muted-foreground cursor-pointer">
              Also email login link (instead of password-only)
            </label>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
          <Button type="button" className="w-full" disabled={loading || !emailOk} onClick={() => void handleEnable()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enabling…
              </>
            ) : (
              "Enable portal"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
