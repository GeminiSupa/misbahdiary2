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

  // Fetch all team members (excluding clients from team view, but include all roles)
  // Note: email is not in profiles table, it's in auth.users
  // Note: created_by column doesn't exist in profiles table
  const { data: team, error: teamError } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("firm_id", profile.firm_id)
    .neq("role", "client")
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
      // Type assertion needed due to TypeScript type inference issues
      name: ((member.profile as { full_name?: string | null; email?: string | null } | null | undefined)?.full_name) ?? "Unnamed teammate",
      email: ((member.profile as { full_name?: string | null; email?: string | null } | null | undefined)?.email) ?? "",
    })) ?? [];

  // Type assertion needed due to TypeScript type inference issues
  const teamData = (team as Array<{ id: string; full_name?: string | null; role?: string | null }> | null) ?? [];
  
  // Fetch emails from auth.users using admin client
  const { supabaseAdminClient } = await import("@/lib/supabase/admin");
  const emailMap = new Map<string, string>();
  
  // Fetch emails for all team members
  await Promise.all(
    teamData.map(async (member) => {
      if (member.id) {
        try {
          const { data: authUser } = await supabaseAdminClient.auth.admin.getUserById(member.id);
          if (authUser?.user?.email) {
            emailMap.set(member.id, authUser.user.email);
          }
        } catch (error) {
          console.error(`Failed to fetch email for user ${member.id}:`, error);
        }
      }
    })
  );

  // Note: created_by column doesn't exist in profiles table, so we can't track creators
  const creatorMap = new Map<string, string>();

  const teamMembers =
    teamData
      .filter((member) => member.id) // Ensure member has an id
      .map((member) => ({
        id: member.id,
        name: member.full_name ?? "Unnamed teammate",
        email: emailMap.get(member.id) ?? "",
        role: member.role ?? null,
        createdBy: null, // created_by column doesn't exist in profiles table
      }));

  // Type assertion needed - billing_settings table not in TypeScript types yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: billingSettings } = await (supabase as any)
    .from("billing_settings")
    .select("*")
    .eq("firm_id", profile.firm_id)
    .maybeSingle();

  const canManageStaff = firm?.owner_id === user.id || profile.role === "principal_partner";
  // Only Firm Owners can create users directly; Principal Partners can send invitations
  const isOwner = firm?.owner_id === user.id;
  const canCreateUsers = isOwner; // Only firm owners can create users
  const canEditBilling = isOwner || profile.role === "principal_partner";

  return (
    <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
      {/* Hero Header - SAP Fiori Horizon Style */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-sm shrink-0 sm:h-14 sm:w-14">
                <Settings className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Workspace Settings</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  Configure your personal profile, update firm information, and manage invitations.
                </p>
              </div>
            </div>
          </div>
        </div>
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
        billingInitial={{
          invoicePrefix: billingSettings?.invoice_prefix ?? "INV",
          invoiceNumberFormat: (billingSettings?.invoice_number_format as "YYYY-####" | "####" | "INV-YYYY-####" | "INV-####") ?? "YYYY-####",
          nextInvoiceNumber: billingSettings?.next_invoice_number ?? 1,
          defaultPaymentTermsDays: billingSettings?.default_payment_terms_days ?? 30,
          defaultCurrency: billingSettings?.default_currency ?? "PKR",
          salesTaxRate: Number(billingSettings?.sales_tax_rate ?? 18.0),
          salesTaxLabel: billingSettings?.sales_tax_label ?? "GST",
          taxRegistrationNumber: billingSettings?.tax_registration_number,
          salesTaxRegistrationNumber: billingSettings?.sales_tax_registration_number,
          paymentMethods: (billingSettings?.payment_methods as string[]) ?? ["Bank Transfer", "Cash", "Cheque"],
          bankName: billingSettings?.bank_name,
          accountTitle: billingSettings?.account_title,
          accountNumber: billingSettings?.account_number,
          iban: billingSettings?.iban,
          swiftCode: billingSettings?.swift_code,
          branchCode: billingSettings?.branch_code,
          branchAddress: billingSettings?.branch_address,
          invoiceFooter: billingSettings?.invoice_footer,
          invoiceNotes: billingSettings?.invoice_notes ?? "Payment should be made within the specified due date.",
          autoGenerateInvoiceNumber: billingSettings?.auto_generate_invoice_number ?? true,
        }}
        canEditBilling={canEditBilling}
        inviteRows={inviteRows}
        staffRows={staffRows}
        teamMembers={teamMembers}
        canManageStaff={canManageStaff}
        canCreateUsers={canCreateUsers}
        currentUserRole={profile.role}
        currentUserId={user.id}
        firmOwnerId={firm?.owner_id ?? null}
      />
    </div>
  );
}
