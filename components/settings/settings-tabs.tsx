"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import { FirmSettingsCard } from "@/components/settings/firm-settings-card";
import { TeamManagement } from "@/components/settings/team-management";
import { BillingSettingsForm } from "@/components/settings/billing-settings-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Separator } from "@/components/ui/separator";
import { Bell, Building2, CreditCard, LogOut, Settings, User, Users } from "lucide-react";

type InviteRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedBy: string | null;
  createdAt: string;
  expiresAt: string | null;
};

type StaffRowDisplay = {
  userId: string;
  role: string;
  assignedCourts: string[];
  assignedDistricts: string[];
  name: string;
  email: string;
};

type TeamMemberDisplay = {
  id: string;
  name: string;
  email: string;
  role: string | null;
};

type SettingsTabsProps = {
  profileInitial: {
    fullName: string;
    phone: string;
    languagePreference: "en" | "ur";
  };
  firmInitial: {
    name: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
  };
  canEditFirm: boolean;
  notificationInitial: {
    hearingReminders: boolean;
    invoiceReminders: boolean;
    announcementUpdates: boolean;
  };
  billingInitial?: {
    invoicePrefix: string;
    invoiceNumberFormat: "YYYY-####" | "####" | "INV-YYYY-####" | "INV-####";
    nextInvoiceNumber: number;
    defaultPaymentTermsDays: number;
    defaultCurrency: string;
    salesTaxRate: number;
    salesTaxLabel: string;
    taxRegistrationNumber: string | null;
    salesTaxRegistrationNumber: string | null;
    paymentMethods: string[];
    bankName: string | null;
    accountTitle: string | null;
    accountNumber: string | null;
    iban: string | null;
    swiftCode: string | null;
    branchCode: string | null;
    branchAddress: string | null;
    invoiceFooter: string | null;
    invoiceNotes: string | null;
    autoGenerateInvoiceNumber: boolean;
  };
  canEditBilling: boolean;
  inviteRows: InviteRow[];
  staffRows: StaffRowDisplay[];
  teamMembers: TeamMemberDisplay[];
  canManageStaff: boolean;
  canCreateUsers: boolean;
  currentUserRole: string | null;
};

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "firm", label: "Firm info", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "team", label: "Team", icon: Users },
  { id: "billing", label: "Billing settings", icon: CreditCard },
  { id: "account", label: "Account", icon: Settings },
];

export function SettingsTabs({
  profileInitial,
  firmInitial,
  canEditFirm,
  notificationInitial,
  billingInitial,
  canEditBilling,
  inviteRows,
  staffRows,
  teamMembers,
  canManageStaff,
  canCreateUsers,
  currentUserRole,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("profile");

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* SAP Fiori-style horizontal tab menu - Mobile optimized */}
      <div className="w-full -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="flex flex-row gap-1 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex flex-col items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all whitespace-nowrap snap-start",
                  "min-h-[64px] min-w-[80px] sm:min-h-[56px] sm:min-w-[100px] flex-shrink-0",
                  "hover:scale-[1.02] active:scale-[0.98] touch-manipulation",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground bg-card/50 border border-border/40",
                )}
              >
                <Icon className={cn("h-5 w-5 sm:h-4 sm:w-4 flex-shrink-0", isActive && "text-primary-foreground")} />
                <span className="text-[10px] sm:text-xs leading-tight text-center">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content panel */}
      <div className="w-full">
        {activeTab === "profile" && (
          <ProfileSettingsForm initialValues={profileInitial} />
        )}

        {activeTab === "firm" && (
          <FirmSettingsCard initialValues={firmInitial} canEdit={canEditFirm} />
        )}

        {activeTab === "notifications" && (
          <NotificationSettingsForm initialValues={notificationInitial} />
        )}

        {activeTab === "team" && (
          <TeamManagement
            teamMembers={teamMembers}
            invitations={inviteRows}
            staffMembers={staffRows}
            canManageTeam={canManageStaff}
            canCreateUsers={canCreateUsers}
            currentUserRole={currentUserRole}
          />
        )}

        {activeTab === "billing" && (
          <BillingSettingsForm 
            initialValues={billingInitial || {
              invoicePrefix: "INV",
              invoiceNumberFormat: "YYYY-####",
              nextInvoiceNumber: 1,
              defaultPaymentTermsDays: 30,
              defaultCurrency: "PKR",
              salesTaxRate: 18.0,
              salesTaxLabel: "GST",
              taxRegistrationNumber: null,
              salesTaxRegistrationNumber: null,
              paymentMethods: ["Bank Transfer", "Cash", "Cheque"],
              bankName: null,
              accountTitle: null,
              accountNumber: null,
              iban: null,
              swiftCode: null,
              branchCode: null,
              branchAddress: null,
              invoiceFooter: null,
              invoiceNotes: "Payment should be made within the specified due date.",
              autoGenerateInvoiceNumber: true,
            }} 
            canEdit={canEditBilling} 
          />
        )}

        {activeTab === "account" && (
          <div className="sap-card">
            <div className="sap-card-body space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Account Management</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your account and sign out of Lawyer Diary.
                </p>
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-background/50">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-destructive/10 p-2">
                    <LogOut className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Sign Out</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sign out of your account on this device
                    </p>
                  </div>
                </div>
                <SignOutButton variant="destructive" className="w-full sm:w-auto" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


