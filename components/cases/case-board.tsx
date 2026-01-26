"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { matterStatusOptions } from "@/lib/constants/cases";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DeleteMatterButton } from "@/components/cases/delete-matter-button";

type CaseItem = {
  id: string;
  serialNumber: string;
  caseNumber: string | null;
  status: string;
  matterType: string;
  caseType: string | null;
  filingDate: string | null;
  courtName: string | null;
  district: string | null;
  clientName: string | null;
};

type CaseBoardProps = {
  cases: CaseItem[];
};

export function CaseBoard({ cases }: CaseBoardProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
      }),
    [],
  );

  const filteredCases = useMemo(() => {
    return cases.filter((matter) => {
      const matchesQuery =
        !query ||
        [
          matter.serialNumber,
          matter.caseNumber ?? "",
          matter.matterType,
          matter.caseType ?? "",
          matter.clientName ?? "",
          matter.courtName ?? "",
          matter.district ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesStatus = statusFilter === "all" || matter.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [cases, query, statusFilter]);

  const statusLabel = useMemo(
    () => new Map(matterStatusOptions.map((option) => [option.value, option.label])),
    [],
  );

  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4 sm:space-y-6">
        <div className="sap-card-header">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground sm:text-xl">Open matters</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Filter by status, court, district, or client to focus on today's workload.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full sm:w-auto">
            <Input
              placeholder="Search serial, case number, client..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full sm:w-60 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm shadow-inner sm:w-40"
            >
              <option value="all">All statuses</option>
              {matterStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {(query || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatusFilter("all");
                }}
                className="w-full sm:w-auto"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground sm:text-sm">
          <span>
            Showing <span className="font-medium text-foreground">{filteredCases.length}</span> of {" "}
            <span className="font-medium text-foreground">{cases.length}</span> matters
          </span>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {filteredCases.length > 0 ? (
            filteredCases.map((matter) => (
              <article
                key={matter.id}
                className={cn(
                  "sap-tile space-y-2 sm:space-y-3 cursor-pointer transition-all overflow-hidden",
                  "hover:shadow-md hover:border-primary/20 active:scale-[0.98]",
                  "group"
                )}
                onClick={(e) => {
                  // Don't navigate if clicking on buttons or links
                  const target = e.target as HTMLElement;
                  if (target.closest('button, a')) {
                    return;
                  }
                  router.push(`/cases/${matter.id}`);
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs truncate">
                      Serial {matter.serialNumber}
                    </p>
                    <h3 className="text-sm font-semibold text-foreground sm:text-base truncate group-hover:text-primary transition-colors" title={matter.clientName ?? "Unassigned client"}>
                      {matter.clientName ?? "Unassigned client"}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      "capitalize border-none px-2 py-0.5 text-[10px] font-medium shrink-0 sm:text-xs whitespace-nowrap " +
                      (matter.status === "execution" || matter.status === "review"
                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                        : matter.status === "pending" || matter.status === "fresh diary"
                        ? "bg-[var(--warning-soft)] text-[var(--warning)]"
                        : matter.status === "appeal"
                        ? "bg-[var(--destructive-soft)] text-[var(--destructive)]"
                        : "bg-[var(--muted-soft)] text-slate-600")
                    }
                  >
                    {statusLabel.get(matter.status as any) ?? matter.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground sm:gap-x-4 sm:gap-y-2 sm:text-sm">
                  <span className="truncate max-w-full" title={`Type: ${matter.matterType}`}>Type: {matter.matterType}</span>
                  {matter.caseType ? <span className="truncate max-w-full" title={`Case type: ${matter.caseType}`}>Case type: {matter.caseType}</span> : null}
                  {matter.caseNumber ? <span className="truncate max-w-full" title={`Case #: ${matter.caseNumber}`}>Case #: {matter.caseNumber}</span> : null}
                  {matter.courtName ? <span className="truncate max-w-full" title={`Court: ${matter.courtName}`}>Court: {matter.courtName}</span> : null}
                  {matter.district ? <span className="truncate max-w-full" title={`District: ${matter.district}`}>District: {matter.district}</span> : null}
                  {matter.filingDate ? (
                    <span className="truncate max-w-full" title={`Filed: ${formatter.format(new Date(matter.filingDate))}`}>
                      Filed: {formatter.format(new Date(matter.filingDate))}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild variant="secondary" size="sm" className="flex-1 sm:flex-initial min-w-0" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/cases/${matter.id}`} className="truncate">Open detail</Link>
                  </Button>
                  <div onClick={(e) => e.stopPropagation()}>
                    <DeleteMatterButton
                      matterId={matter.id}
                      matterSerial={matter.serialNumber}
                      size="sm"
                      className="flex-1 sm:flex-initial"
                    />
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="sap-subtle">
              <p className="text-sm font-medium text-foreground sm:text-base">No matters match your filters</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Adjust the search terms or status filter to see more matters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

