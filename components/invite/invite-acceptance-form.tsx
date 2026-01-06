"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptInvitation } from "@/app/invite/[token]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

type InviteAcceptanceFormProps = {
  token: string;
  email: string;
  roleLabel: string;
};

export function InviteAcceptanceForm({ token, email, roleLabel }: InviteAcceptanceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setFormError(null);
    setFormSuccess(null);

    formData.append("token", token);

    startTransition(async () => {
      const result = await acceptInvitation(formData);

      if (result.fieldErrors) {
        setFormError(result.message ?? "Please review the highlighted fields.");
        return;
      }

      if (!result.success) {
        setFormError(result.message ?? "Something went wrong. Please try again.");
        return;
      }

      if (result.message) {
        setFormSuccess(result.message);
      } else {
        setFormSuccess("Invitation accepted successfully.");
      }

      if (result.redirectTo) {
        router.replace(result.redirectTo);
        router.refresh();
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to accept invitation</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {formSuccess ? (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{formSuccess}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 rounded-2xl border border-border/70 bg-card/80 p-5">
        <div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Email address
          </span>
          <p className="font-medium text-foreground">{email}</p>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Role
          </span>
          <p className="font-medium text-foreground">{roleLabel}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium text-foreground">
            Full name
          </label>
          <Input id="fullName" name="fullName" placeholder="Your full name" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-foreground">
            Contact number (optional)
          </label>
          <Input id="phone" name="phone" placeholder="+92 300 1234567" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
          />
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Language preference</span>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border/60 bg-background/60 px-4 py-2 text-sm transition hover:border-primary/60">
            English
            <input type="radio" name="languagePreference" value="en" defaultChecked />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border/60 bg-background/60 px-4 py-2 text-sm transition hover:border-primary/60">
            اردو
            <input type="radio" name="languagePreference" value="ur" />
          </label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Join workspace
      </Button>
    </form>
  );
}

