"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Crown,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InviteManager } from "./invite-manager";
import { StaffManager } from "./staff-manager";
import { CreateUserForm } from "./create-user-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string | null;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedBy: string | null;
  createdAt: string;
  expiresAt: string | null;
};

type StaffMember = {
  userId: string;
  name: string;
  email: string;
  role: string;
  assignedCourts: string[];
  assignedDistricts: string[];
};

type TeamManagementProps = {
  teamMembers: TeamMember[];
  invitations: Invitation[];
  staffMembers: StaffMember[];
  canManageTeam: boolean;
  canCreateUsers: boolean;
  currentUserRole: string | null;
};

const ROLE_INFO = {
  principal_partner: {
    label: "Principal Partner",
    icon: Crown,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    description: "Full access to all cases, can manage team members",
    canSeeAllCases: true,
    canManageTeam: true,
  },
  associate: {
    label: "Associate",
    icon: Briefcase,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    description: "Can see assigned cases and cases they created",
    canSeeAllCases: false,
    canManageTeam: false,
  },
  paralegal: {
    label: "Paralegal",
    icon: UserCheck,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    description: "Can see only assigned cases",
    canSeeAllCases: false,
    canManageTeam: false,
  },
  of_counsel: {
    label: "Of Counsel",
    icon: Shield,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    description: "Can see assigned cases and cases they created",
    canSeeAllCases: false,
    canManageTeam: false,
  },
  staff: {
    label: "Staff",
    icon: Users,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    description: "Can see only assigned cases",
    canSeeAllCases: false,
    canManageTeam: false,
  },
  client: {
    label: "Client",
    icon: Mail,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    description: "Can see only their own cases",
    canSeeAllCases: false,
    canManageTeam: false,
  },
};

export function TeamManagement({
  teamMembers,
  invitations,
  staffMembers,
  canManageTeam,
  canCreateUsers,
  currentUserRole,
}: TeamManagementProps) {
  const router = useRouter();

  const getRoleInfo = (role: string | null) => {
    if (!role) return ROLE_INFO.staff;
    return ROLE_INFO[role as keyof typeof ROLE_INFO] || ROLE_INFO.staff;
  };

  const currentRoleInfo = getRoleInfo(currentUserRole);

  return (
    <div className="space-y-5">
      {/* Access Control Overview - More compact */}
      <Card className="border border-border/60 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Your Role & Permissions</CardTitle>
              <CardDescription className="text-xs">
                Current access level and role capabilities
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border/60 bg-gradient-to-br from-background to-muted/20 p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg ${currentRoleInfo.bgColor} p-2.5`}>
                {currentRoleInfo.icon && (
                  <currentRoleInfo.icon className={`h-5 w-5 ${currentRoleInfo.color}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-sm">Your Role: {currentRoleInfo.label}</p>
                  <Badge
                    variant="outline"
                    className={`${currentRoleInfo.borderColor} ${currentRoleInfo.bgColor} ${currentRoleInfo.color} text-xs`}
                  >
                    {currentRoleInfo.canSeeAllCases ? (
                      <>
                        <Eye className="mr-1 h-3 w-3" />
                        All Cases
                      </>
                    ) : (
                      <>
                        <EyeOff className="mr-1 h-3 w-3" />
                        Assigned Only
                      </>
                    )}
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{currentRoleInfo.description}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members List - SAP Fiori compact style */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-sm sm:text-base">Team Members</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs mt-0.5">
                  {teamMembers.length} {teamMembers.length === 1 ? "member" : "members"} in workspace
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length > 0 ? (
            <div className="space-y-2">
              {teamMembers.map((member) => {
                const roleInfo = getRoleInfo(member.role);
                const Icon = roleInfo.icon;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 p-3 sm:p-3.5 transition hover:border-primary/40 hover:bg-background/80 touch-manipulation"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                      <div className={`rounded-lg ${roleInfo.bgColor} p-1.5 sm:p-2 flex-shrink-0`}>
                        <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${roleInfo.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm truncate">{member.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <Badge
                        variant="outline"
                        className={`${roleInfo.borderColor} ${roleInfo.bgColor} ${roleInfo.color} text-[10px] sm:text-xs`}
                      >
                        {roleInfo.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 sm:p-6 text-center">
              <Users className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs sm:text-sm font-medium text-foreground">No team members yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                {canCreateUsers ? "Create accounts or send invitations to get started" : "Contact a Principal Partner to add team members"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Team Members Section */}
      {canCreateUsers && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <UserPlus className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base">Add Team Members</CardTitle>
                <CardDescription className="text-xs">
                  Create accounts directly or send email invitations
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-10">
                <TabsTrigger value="create" className="text-sm">Create Account</TabsTrigger>
                <TabsTrigger value="invite" className="text-sm">Send Invitation</TabsTrigger>
              </TabsList>
              <TabsContent value="create" className="mt-4">
                <CreateUserForm />
              </TabsContent>
              <TabsContent value="invite" className="mt-4">
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 mb-4">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Recommended:</strong> Send an email invitation. Users will set their own password when accepting, which is more secure.
                  </p>
                </div>
                <InviteManager invitations={invitations} canInvite={canCreateUsers} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Staff Assignments */}
      {canManageTeam && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Briefcase className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Staff Assignments</CardTitle>
                <CardDescription className="text-xs">
                  Assign team members to courts and districts for case management
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StaffManager
              staff={staffMembers}
              teamMembers={teamMembers}
              canEdit={canManageTeam}
            />
          </CardContent>
        </Card>
      )}

      {!canCreateUsers && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-400">Restricted Access</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
            Only <strong>Principal Partners</strong> can create user accounts and send invitations.
            {canManageTeam
              ? " You can manage staff assignments, but cannot add new team members."
              : " Contact a Principal Partner to add new team members."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

