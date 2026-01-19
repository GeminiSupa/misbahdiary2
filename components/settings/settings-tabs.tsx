"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import { FirmSettingsCard } from "@/components/settings/firm-settings-card";
import { TeamManagement } from "@/components/settings/team-management";
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
  inviteRows,
  staffRows,
  teamMembers,
  canManageStaff,
  canCreateUsers,
  currentUserRole,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("profile");

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
      {/* Left vertical tab menu */}
      <nav className="w-full rounded-2xl border border-border/60 bg-card/90 p-2 shadow-sm md:w-64 md:p-3">
        <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Settings
        </div>
        <div className="flex flex-row gap-1.5 overflow-x-auto pb-2 md:flex-col md:gap-1 md:pb-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  "whitespace-nowrap md:w-full min-h-[44px] sm:min-h-[40px]",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-primary-foreground")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Right content panel */}
      <div className="flex-1 min-w-0">
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
          <div className="sap-card">
            <div className="sap-card-body space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Billing Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure invoice defaults and billing preferences.
                </p>
              </div>
              <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-8 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">Coming Soon</p>
                <p className="text-xs text-muted-foreground">
                  Billing configuration (tax profiles, invoice templates, payment methods) will
                  appear here in a future version.
                </p>
              </div>
            </div>
          </div>
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


