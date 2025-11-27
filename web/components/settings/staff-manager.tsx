"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { upsertStaffMember, removeStaffMember } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, UsersRound, Trash2 } from "lucide-react";

type StaffMember = {
  userId: string;
  name: string;
  email: string;
  role: string;
  assignedCourts: string[];
  assignedDistricts: string[];
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string | null;
};

const STAFF_ROLE_OPTIONS = [
  { value: "junior", label: "Junior Counsel" },
  { value: "senior", label: "Senior Counsel" },
  { value: "staff", label: "Support Staff" },
];

function parseList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

type StaffManagerProps = {
  staff: StaffMember[];
  teamMembers: TeamMember[];
  canEdit: boolean;
};

export function StaffManager({ staff, teamMembers, canEdit }: StaffManagerProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>(() => staff[0]?.userId ?? "");
  const [role, setRole] = useState<string>(staff[0]?.role ?? "junior");
  const [courtsInput, setCourtsInput] = useState<string>(
    staff[0]?.assignedCourts.join(", ") ?? "",
  );
  const [districtsInput, setDistrictsInput] = useState<string>(
    staff[0]?.assignedDistricts.join(", ") ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableMembers = useMemo(() => {
    return teamMembers.sort((a, b) => a.name.localeCompare(b.name));
  }, [teamMembers]);
  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextId = event.target.value;
    setSelectedUserId(nextId);

    if (!nextId) {
      setRole("junior");
      setCourtsInput("");
      setDistrictsInput("");
      return;
    }

    const existing = staff.find((member) => member.userId === nextId);
    if (existing) {
      setRole(existing.role ?? "junior");
      setCourtsInput(existing.assignedCourts.join(", "));
      setDistrictsInput(existing.assignedDistricts.join(", "));
    } else {
      setRole("junior");
      setCourtsInput("");
      setDistrictsInput("");
    }
  };


  const handleSubmit = () => {
    if (!selectedUserId) {
      setMessage("Select a teammate to assign.");
      return;
    }
    setMessage(null);
    const assignedCourts = parseList(courtsInput);
    const assignedDistricts = parseList(districtsInput);
    startTransition(async () => {
      const result = await upsertStaffMember({
        userId: selectedUserId,
        role: role as "junior" | "senior" | "staff",
        assignedCourts,
        assignedDistricts,
      });
      if (result.message) {
        setMessage(result.message);
      } else if (result.success) {
        setMessage("Staff record saved.");
      }
    });
  };

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      const result = await removeStaffMember(userId);
      if (result.message) {
        setMessage(result.message);
      } else if (result.success) {
        setMessage("Staff member removed.");
        if (selectedUserId === userId) {
          setSelectedUserId("");
          setRole("junior");
          setCourtsInput("");
          setDistrictsInput("");
        }
      }
    });
  };

  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4">
        <div className="sap-card-header">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-primary" />
              Staff assignments
            </h2>
            <p className="text-sm text-muted-foreground">
              Map juniors, support staff, and counsel to the courts and districts they cover.
            </p>
          </div>
        </div>

        {staff.length > 0 ? (
          <div className="grid gap-2">
            {staff.map((member) => (
              <div
                key={member.userId}
                className="flex flex-wrap items-center justify-between rounded-xl border border-border/60 bg-background/80 px-4 py-3 text-sm"
              >
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{member.name}</p>
                  <p className="text-muted-foreground text-xs">{member.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">
                      {member.role}
                    </Badge>
                    {member.assignedCourts.slice(0, 3).map((court) => (
                      <Badge key={court} variant="secondary">
                        {court}
                      </Badge>
                    ))}
                    {member.assignedCourts.length > 3 ? (
                      <Badge variant="secondary">+{member.assignedCourts.length - 3}</Badge>
                    ) : null}
                  </div>
                </div>
                {canEdit ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemove(member.userId)}
                    disabled={isPending}
                    aria-label={`Remove ${member.name}`}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="sap-subtle">
            <p className="text-sm text-muted-foreground">
              No staff assignments yet. Use the form below to add your first teammate.
            </p>
          </div>
        )}

        {canEdit ? (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Assign teammate</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm text-muted-foreground">
                  Teammate
                  <select
                    value={selectedUserId}
                    onChange={handleSelectChange}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select teammate</option>
                    {availableMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} {member.email ? `(${member.email})` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm text-muted-foreground">
                  Role
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {STAFF_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1 text-sm text-muted-foreground">
                Assigned courts (comma or newline separated)
                <Textarea
                  value={courtsInput}
                  onChange={(event) => setCourtsInput(event.target.value)}
                  rows={2}
                  placeholder="Islamabad High Court, Supreme Court of Pakistan"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-muted-foreground">
                Assigned districts (comma or newline separated)
                <Textarea
                  value={districtsInput}
                  onChange={(event) => setDistrictsInput(event.target.value)}
                  rows={2}
                  placeholder="Islamabad, Lahore, Rawalpindi"
                />
              </label>

              {message ? (
                <p className="text-sm text-muted-foreground">{message}</p>
              ) : null}

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save assignment
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedUserId("");
                    setRole("junior");
                    setCourtsInput("");
                    setDistrictsInput("");
                    setMessage(null);
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

