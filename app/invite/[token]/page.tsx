import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdminClient } from "@/lib/supabase/admin";
import { InviteAcceptanceForm } from "@/components/invite/invite-acceptance-form";
import { Button } from "@/components/ui/button";

const ROLE_LABELS: Record<string, string> = {
  principal_partner: "Principal / Partner",
  associate: "Associate",
  paralegal: "Paralegal",
  of_counsel: "Of Counsel",
  client: "Client",
  staff: "Staff",
};

type InvitePageProps = {
  params: { token: string };
};

export default async function InvitePage({ params }: InvitePageProps) {
  const token = params.token;

  if (!token || token.length < 10) {
    redirect("/");
  }

  const { data: invitation } = await supabaseAdminClient
    .from("firm_invitations")
    .select(
      `
        id,
        email,
        role,
        status,
        expires_at,
        firm:firms ( id, name )
      `,
    )
    .eq("token", token)
    .maybeSingle();

  if (!invitation) {
    return (
      <InviteLayout title="Invitation not found">
        <p className="text-sm text-muted-foreground">
          This invitation link is invalid or has already been used.
        </p>
        <Button asChild className="mt-4">
          <Link href="/sign-in">Go to sign in</Link>
        </Button>
      </InviteLayout>
    );
  }

  const expired =
    invitation.expires_at && new Date(invitation.expires_at) < new Date();

  if (invitation.status !== "pending" || expired) {
    const reason =
      expired ? "This invitation has expired." : `This invitation is already ${invitation.status}.`;

    return (
      <InviteLayout title="Invitation unavailable" firmName={invitation.firm?.name}>
        <p className="text-sm text-muted-foreground">{reason}</p>
        <Button asChild className="mt-4">
          <Link href="/sign-in">Sign in</Link>
        </Button>
      </InviteLayout>
    );
  }

  const roleLabel = ROLE_LABELS[invitation.role] ?? invitation.role;

  return (
    <InviteLayout
      title="Join workspace"
      firmName={invitation.firm?.name}
      subtitle={`You were invited to join ${invitation.firm?.name ?? "this firm"} as ${roleLabel}.`}
    >
      <InviteAcceptanceForm token={token} email={invitation.email} roleLabel={roleLabel} />
    </InviteLayout>
  );
}

function InviteLayout({
  title,
  subtitle,
  firmName,
  children,
}: {
  title: string;
  subtitle?: string;
  firmName?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted">
      <div className="w-full max-w-md px-4 py-10">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Lawyer Diary</p>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {firmName ? (
            <p className="text-sm font-medium text-primary">{firmName}</p>
          ) : null}
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="mt-6 rounded-3xl border border-border/70 bg-card/95 p-6 shadow-xl backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  );
}

