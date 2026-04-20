import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Mail, Briefcase, MapPin, User, Settings, Clock, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export type MatterTeamMember = {
  id: string;
  name: string;
  email: string;
  firmRole?: string | null;
  assignmentRole?: "junior" | "senior" | "staff" | null;
  courts: string[];
  districts: string[];
  assignedBy?: { id: string; name: string } | null;
  assignedAt?: string | null;
  assignmentNotes?: string | null;
};

type MatterTeamCardProps = {
  members: MatterTeamMember[];
  client: {
    name: string;
    representation: string | null;
    representativeDetails: unknown;
  };
};

const ROLE_LABEL: Record<string, string> = {
  junior: "Junior counsel",
  senior: "Senior counsel",
  staff: "Support staff",
};

export function MatterTeamCard({ members, client }: MatterTeamCardProps) {
  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-6">
        <div className="sap-card-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Matter Team</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Review who is responsible for filings and hearings across courts and districts.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/settings" className="flex flex-wrap items-center justify-center gap-2">
              <Settings className="mr-2 h-4 w-4 shrink-0" />
              <span>Manage Staff</span>
            </Link>
          </Button>
        </div>

        {members.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No teammates assigned. Visit settings to map juniors or staff to this matter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <article
                key={member.id}
                className="rounded-xl border-2 border-border/60 bg-linear-to-br from-background/80 to-background/60 px-4 py-3 sm:px-5 sm:py-4 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{member.name}</p>
                      {member.email && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                    {member.assignmentRole && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        <Briefcase className="mr-1 h-3 w-3" />
                        {ROLE_LABEL[member.assignmentRole] ?? member.assignmentRole}
                      </Badge>
                    )}
                    {member.firmRole && (
                      <Badge variant="secondary" className="capitalize text-xs shrink-0">
                        {member.firmRole.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                </div>
                {(member.courts.length > 0 || member.districts.length > 0 || member.assignedBy) && (
                  <div className="space-y-2 pt-3 border-t border-border/60">
                    {(member.courts.length > 0 || member.districts.length > 0) && (
                      <div className="flex flex-wrap gap-2">
                        {member.courts.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="capitalize bg-primary/10 text-primary text-xs"
                          >
                            <MapPin className="mr-1 h-3 w-3" />
                            {member.courts.slice(0, 2).join(", ")}
                            {member.courts.length > 2 ? ` +${member.courts.length - 2}` : ""}
                          </Badge>
                        )}
                        {member.districts.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="capitalize bg-secondary/20 text-secondary-foreground text-xs"
                          >
                            <MapPin className="mr-1 h-3 w-3" />
                            {member.districts.slice(0, 2).join(", ")}
                            {member.districts.length > 2 ? ` +${member.districts.length - 2}` : ""}
                          </Badge>
                        )}
                      </div>
                    )}
                    {member.assignedBy && (
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <UserPlus className="h-3 w-3" />
                          <span>Assigned by {member.assignedBy.name}</span>
                        </div>
                        {member.assignedAt && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              <span>{format(new Date(member.assignedAt), "MMM d, yyyy")}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {member.assignmentNotes && (
                      <p className="text-xs text-muted-foreground italic">
                        Note: {member.assignmentNotes}
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <div className="rounded-xl border-2 border-primary/20 bg-linear-to-br from-primary/5 to-primary/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Client</p>
          </div>
          <p className="text-sm font-bold text-foreground">{client.name}</p>
          {client.representation &&
            typeof client.representativeDetails === "object" &&
            client.representativeDetails !== null && (
              <p className="mt-2 text-xs text-muted-foreground">
                Represents{" "}
                <span className="font-semibold text-foreground">
                  {String((client.representativeDetails as { to_whom?: string }).to_whom ?? "")}
                </span>
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
