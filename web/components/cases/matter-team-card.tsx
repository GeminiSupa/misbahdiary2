import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type MatterTeamMember = {
  id: string;
  name: string;
  email: string;
  firmRole?: string | null;
  assignmentRole?: "junior" | "senior" | "staff" | null;
  courts: string[];
  districts: string[];
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
      <div className="sap-card-body space-y-4">
        <div className="sap-card-header">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Matter team</h2>
            <p className="text-sm text-muted-foreground">
              Review who is responsible for filings and hearings across courts and districts.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/settings">Manage staff</Link>
          </Button>
        </div>

        {members.length === 0 ? (
          <div className="sap-subtle">
            <p className="text-sm text-muted-foreground">
              No teammates assigned. Visit settings to map juniors or staff to this matter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <article
                key={member.id}
                className="rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    {member.email ? (
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {member.assignmentRole ? (
                      <Badge variant="outline">{ROLE_LABEL[member.assignmentRole] ?? member.assignmentRole}</Badge>
                    ) : null}
                    {member.firmRole ? (
                      <Badge variant="secondary" className="capitalize">
                        {member.firmRole.replace("_", " ")}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {member.courts.length > 0 ? (
                    <Badge variant="ghost" className="capitalize bg-primary/10 text-primary">
                      {member.courts.slice(0, 2).join(", ")}
                      {member.courts.length > 2 ? ` +${member.courts.length - 2}` : ""}
                    </Badge>
                  ) : null}
                  {member.districts.length > 0 ? (
                    <Badge variant="ghost" className="capitalize bg-secondary/20 text-secondary-foreground">
                      {member.districts.slice(0, 2).join(", ")}
                      {member.districts.length > 2 ? ` +${member.districts.length - 2}` : ""}
                    </Badge>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-xs text-muted-foreground">
          <p>
            Client: <span className="font-semibold text-foreground">{client.name}</span>
          </p>
          {client.representation && typeof client.representativeDetails === "object" && client.representativeDetails !== null ? (
            <p className="mt-1">
              Represents {String((client.representativeDetails as { to_whom?: string }).to_whom ?? "")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
