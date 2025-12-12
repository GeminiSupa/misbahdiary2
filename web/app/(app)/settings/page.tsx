// @ts-nocheck

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Settings } from "lucide-react";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export const metadata: Metadata = {
  title: "Settings • Lawyer Diary",
};

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, language_preference, firm_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    redirect("/onboarding");
  }

  const { data: firm } = await supabase
    .from("firms")
    .select("id, name, contact_email, contact_phone, address, owner_id")
    .eq("id", profile.firm_id)
    .maybeSingle();

  const { data: invitations } = await supabase
    .from("firm_invitations")
    .select("id, email, role, status, invited_by, created_at, expires_at")
    .eq("firm_id", profile.firm_id)
    .order("created_at", { ascending: false });

  const { data: preferences } = await supabase
    .from("notification_preferences")
    .select("hearing_reminders, invoice_reminders, announcement_updates")
    .eq("profile_id", user.id)
    .maybeSingle();

  const { data: staff } = await supabase
    .from("staff")
    .select(
      `
        user_id,
        role,
        assigned_courts,
        assigned_districts,
        profile:profiles (
          full_name,
          email
        )
      `,
    )
    .eq("firm_id", profile.firm_id)
    .order("updated_at", { ascending: false });

  const { data: team } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("firm_id", profile.firm_id)
    .order("full_name");

  const inviteRows =
    invitations?.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      invitedBy: invite.invited_by,
      createdAt: invite.created_at,
      expiresAt: invite.expires_at,
    })) ?? [];

  const staffRows =
    staff?.map((member) => ({
      userId: member.user_id,
      role: member.role ?? "junior",
      assignedCourts: (member.assigned_courts as string[] | null) ?? [],
      assignedDistricts: (member.assigned_districts as string[] | null) ?? [],
      name: member.profile?.full_name ?? "Unnamed teammate",
      email: member.profile?.email ?? "",
    })) ?? [];

  const teamMembers =
    team?.map((member) => ({
      id: member.id,
      name: member.full_name ?? member.email ?? "Unnamed teammate",
      email: member.email ?? "",
      role: member.role,
    })) ?? [];

  const canManageStaff = firm?.owner_id === user.id || profile.role === "principal_partner";
  // ONLY Principal Partners can create users and send invitations
  const canCreateUsers = profile.role === "principal_partner";

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 shadow-xl backdrop-blur sm:rounded-3xl sm:p-6 md:p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg flex-shrink-0 sm:h-12 sm:w-12 sm:rounded-2xl md:h-14 md:w-14">
              <Settings className="h-5 w-5 text-white sm:h-6 sm:w-6 md:h-7 md:w-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">Workspace Settings</h1>
              <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm line-clamp-2">
                Configure your personal profile, update firm information, and manage invitations.
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-indigo-400/10 blur-2xl" />
      </div>

      <SettingsTabs
        profileInitial={{
          fullName: profile.full_name ?? user.email ?? "",
          phone: profile.phone ?? "",
          languagePreference: (profile.language_preference as "en" | "ur") ?? "en",
        }}
        firmInitial={{
          name: firm?.name ?? "Your firm",
          contactEmail: firm?.contact_email ?? "",
          contactPhone: firm?.contact_phone ?? "",
          address: firm?.address ?? "",
        }}
        canEditFirm={firm?.owner_id === user.id}
        notificationInitial={{
          hearingReminders: preferences?.hearing_reminders ?? true,
          invoiceReminders: preferences?.invoice_reminders ?? true,
          announcementUpdates: preferences?.announcement_updates ?? true,
        }}
        inviteRows={inviteRows}
        staffRows={staffRows}
        teamMembers={teamMembers}
        canManageStaff={canManageStaff}
        canCreateUsers={canCreateUsers}
        currentUserRole={profile.role}
      />
    </div>
  );
}
