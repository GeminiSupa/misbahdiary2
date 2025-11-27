"use client";

import { useMemo, useState } from "react";
import { matterStatusOptions } from "@/lib/constants/cases";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
      <div className="sap-card-body space-y-6">
        <div className="sap-card-header">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Open matters</h2>
            <p className="text-sm text-muted-foreground">
              Filter by status, court, district, or client to focus on today’s workload.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="Search serial, case number, client..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full sm:w-60"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-inner sm:w-40"
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
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Showing <span className="font-medium text-foreground">{filteredCases.length}</span> of {" "}
            <span className="font-medium text-foreground">{cases.length}</span> matters
          </span>
        </div>

        <div className="space-y-3">
          {filteredCases.length > 0 ? (
            filteredCases.map((matter) => (
              <article
                key={matter.id}
                className="sap-tile space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Serial {matter.serialNumber}
                    </p>
                    <h3 className="text-base font-semibold text-foreground">
                      {matter.clientName ?? "Unassigned client"}
                    </h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      "capitalize border-none px-2.5 py-0.5 text-xs font-medium " +
                      (matter.status === "execution" || matter.status === "review"
                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                        : matter.status === "pending" || matter.status === "fresh diary"
                        ? "bg-[var(--warning-soft)] text-[var(--warning)]"
                        : matter.status === "appeal"
                        ? "bg-[var(--destructive-soft)] text-[var(--destructive)]"
                        : "bg-[var(--muted-soft)] text-slate-600")
                    }
                  >
                    {statusLabel.get(matter.status) ?? matter.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span>Type: {matter.matterType}</span>
                  {matter.caseType ? <span>Case type: {matter.caseType}</span> : null}
                  {matter.caseNumber ? <span>Case #: {matter.caseNumber}</span> : null}
                  {matter.courtName ? <span>Court: {matter.courtName}</span> : null}
                  {matter.district ? <span>District: {matter.district}</span> : null}
                  {matter.filingDate ? (
                    <span>
                      Filed: {formatter.format(new Date(matter.filingDate))}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/cases/${matter.id}`}>Open detail</Link>
                  </Button>
                </div>
              </article>
            ))
          ) : (
            <div className="sap-subtle">
              <p className="font-medium text-foreground">No matters match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust the search terms or status filter to see more matters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

