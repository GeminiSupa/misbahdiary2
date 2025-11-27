"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import { FirmSettingsCard } from "@/components/settings/firm-settings-card";
import { InviteManager } from "@/components/settings/invite-manager";
import { StaffManager } from "@/components/settings/staff-manager";
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
  inviteRows: InviteRow[];
  staffRows: StaffRowDisplay[];
  teamMembers: TeamMemberDisplay[];
  canManageStaff: boolean;
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
  inviteRows,
  staffRows,
  teamMembers,
  canManageStaff,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("profile");

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
      {/* Left vertical tab menu */}
      <nav className="w-full rounded-2xl border border-border/60 bg-card/90 p-3 shadow-sm md:w-64">
        <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Workspace
        </div>
        <div className="flex flex-row gap-2 overflow-x-auto md:flex-col md:gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                  "whitespace-nowrap md:w-full",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Right content panel */}
      <div className="flex-1">
        <div className="sap-card">
          <div className="sap-card-body space-y-6">
            {activeTab === "profile" && (
              <>
                <div className="sap-card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Profile settings</h2>
                    <p className="text-sm text-muted-foreground">
                      Update your name, contact details, and language preferences.
                    </p>
                  </div>
                </div>
                <ProfileSettingsForm initialValues={profileInitial} />
              </>
            )}

            {activeTab === "firm" && (
              <>
                <div className="sap-card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Firm information</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage your firm’s name, billing contact details, and address.
                    </p>
                  </div>
                </div>
                <FirmSettingsCard initialValues={firmInitial} canEdit={canEditFirm} />
              </>
            )}

            {activeTab === "notifications" && (
              <>
                <div className="sap-card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                    <p className="text-sm text-muted-foreground">
                      Choose which reminders and product announcements you receive.
                    </p>
                  </div>
                </div>
                <NotificationSettingsForm initialValues={notificationInitial} />
              </>
            )}

            {activeTab === "team" && (
              <>
                <div className="sap-card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Team & staff</h2>
                    <p className="text-sm text-muted-foreground">
                      Invite colleagues, assign roles, and define court/district coverage.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Invitations</h3>
                    <p className="text-xs text-muted-foreground">
                      Pending and historical invites for this workspace.
                    </p>
                    <div className="mt-3">
                      <InviteManager invitations={inviteRows} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Staff directory</h3>
                    <p className="text-xs text-muted-foreground">
                      Manage staff roles and court assignments.
                    </p>
                    <div className="mt-3">
                      <StaffManager
                        staff={staffRows}
                        teamMembers={teamMembers}
                        canEdit={canManageStaff}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "billing" && (
              <>
                <div className="sap-card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Billing settings</h2>
                    <p className="text-sm text-muted-foreground">
                      Configure invoice defaults and billing preferences. This area is a placeholder
                      for future billing configuration.
                    </p>
                  </div>
                </div>
                <div className="sap-subtle text-sm text-muted-foreground text-left">
                  Billing configuration (tax profiles, invoice templates, payment methods) will
                  appear here in a future version of Lawyer Diary.
                </div>
              </>
            )}

            {activeTab === "account" && (
              <>
                <div className="sap-card-header">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Account</h2>
                    <p className="text-sm text-muted-foreground">
                      Sign out of Lawyer Diary on this device.
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LogOut className="h-4 w-4 text-destructive" />
                    <span>Sign out of your account</span>
                  </div>
                  <SignOutButton variant="destructive" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


