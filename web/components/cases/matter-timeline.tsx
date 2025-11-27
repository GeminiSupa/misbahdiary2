import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type MatterTimelineEntry = {
  id: string;
  date: string;
  details: string;
  stage?: string | null;
  courtName?: string | null;
  hearingDate?: string | null;
  updatedByName?: string | null;
};

type MatterTimelineProps = {
  entries: MatterTimelineEntry[];
};

export function MatterTimeline({ entries }: MatterTimelineProps) {
  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4">
        <div className="sap-card-header">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Matter timeline</h2>
            <p className="text-sm text-muted-foreground">
              Track filings, hearings, and important updates across the matter lifecycle.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled title="History editing coming soon">
            Add entry
          </Button>
        </div>

        {entries.length === 0 ? (
          <div className="sap-subtle">
            <p className="text-sm text-muted-foreground">
              Timeline entries will appear here once hearings or updates are recorded.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => {
              const formattedDate = format(new Date(entry.date), "dd MMM yyyy");
              const formattedHearing = entry.hearingDate
                ? format(new Date(entry.hearingDate), "dd MMM yyyy")
                : null;
              return (
                <div key={entry.id} className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{formattedDate}</p>
                      {entry.stage ? (
                        <h3 className="text-base font-semibold text-foreground">{entry.stage}</h3>
                      ) : null}
                    </div>
                    {entry.courtName ? (
                      <Badge variant="outline" className="capitalize">
                        {entry.courtName}
                      </Badge>
                    ) : null}
                  </div>
                  <Separator className="my-3" />
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{entry.details}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {formattedHearing ? <span>Next hearing: {formattedHearing}</span> : null}
                    {entry.updatedByName ? <span>Updated by {entry.updatedByName}</span> : null}
                  </div>
                  {index !== entries.length - 1 ? <Separator className="mt-4" /> : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
