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
    <div className="space-y-6">
      {/* Access Control Overview */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Access Control & Permissions</CardTitle>
              <CardDescription>
                Understand who can see what based on their role in your workspace
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border-2 border-primary/20 bg-background/80 p-4">
            <div className="flex items-start gap-3">
              <div className={`rounded-lg ${currentRoleInfo.bgColor} p-2`}>
                {currentRoleInfo.icon && (
                  <currentRoleInfo.icon className={`h-5 w-5 ${currentRoleInfo.color}`} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">Your Role: {currentRoleInfo.label}</p>
                  <Badge
                    variant="outline"
                    className={`${currentRoleInfo.borderColor} ${currentRoleInfo.bgColor} ${currentRoleInfo.color}`}
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
                <p className="mt-1 text-sm text-muted-foreground">{currentRoleInfo.description}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(ROLE_INFO).map(([role, info]) => {
              if (role === "client") return null; // Skip client role in overview
              const Icon = info.icon;
              return (
                <div
                  key={role}
                  className={`rounded-xl border ${info.borderColor} ${info.bgColor} p-3`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 ${info.color} mt-0.5`} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{info.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{info.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {info.canSeeAllCases ? (
                          <Badge variant="outline" className="text-xs">
                            <Eye className="mr-1 h-3 w-3" />
                            All Cases
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <EyeOff className="mr-1 h-3 w-3" />
                            Assigned Only
                          </Badge>
                        )}
                        {info.canManageTeam && (
                          <Badge variant="outline" className="text-xs">
                            <UserPlus className="mr-1 h-3 w-3" />
                            Can Invite
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Team Members ({teamMembers.length})</CardTitle>
                <CardDescription>All members of your workspace</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length > 0 ? (
            <div className="space-y-3">
              {teamMembers.map((member) => {
                const roleInfo = getRoleInfo(member.role);
                const Icon = roleInfo.icon;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 p-4 transition hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg ${roleInfo.bgColor} p-2`}>
                        <Icon className={`h-4 w-4 ${roleInfo.color}`} />
                      </div>
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`${roleInfo.borderColor} ${roleInfo.bgColor} ${roleInfo.color}`}
                      >
                        {roleInfo.label}
                      </Badge>
                      {roleInfo.canSeeAllCases && (
                        <Badge variant="outline" className="text-xs">
                          <Eye className="mr-1 h-3 w-3" />
                          All Cases
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-8 text-center">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No team members yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Invite colleagues to join your workspace
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Team Members Section */}
      {canCreateUsers && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-500/10 p-2">
                  <UserPlus className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>Add Team Members</CardTitle>
                  <CardDescription>
                    Create user accounts directly or send email invitations. Only Principal Partners
                    can add new team members.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="create">Create User Account</TabsTrigger>
                  <TabsTrigger value="invite">Send Invitation</TabsTrigger>
                </TabsList>
                <TabsContent value="create" className="mt-6">
                  <CreateUserForm />
                </TabsContent>
                <TabsContent value="invite" className="mt-6">
                  <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-4 mb-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Invitation Method:</strong> Send an email invitation link. The user
                      will set their own password when they accept the invitation. This is the
                      recommended method for better security.
                    </p>
                  </div>
                  <InviteManager invitations={invitations} canInvite={canCreateUsers} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Staff Assignments - can be managed by Firm Owners and Principal Partners */}
      {canManageTeam && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/10 p-2">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Staff Assignments</CardTitle>
                <CardDescription>
                  Assign staff members to specific courts and districts for better case
                  management.
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
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Restricted Access</AlertTitle>
          <AlertDescription>
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

