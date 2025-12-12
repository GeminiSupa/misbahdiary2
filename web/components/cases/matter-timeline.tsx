import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, MapPin, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewTimelineEntrySheet } from "@/components/cases/new-timeline-entry-sheet";

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
  matterId: string;
};

export function MatterTimeline({ entries, matterId }: MatterTimelineProps) {
  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4 sm:space-y-6">
        <div className="sap-card-header">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              <h2 className="text-base font-semibold text-foreground sm:text-lg">Matter Timeline</h2>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Track filings, hearings, and important updates across the matter lifecycle.
            </p>
          </div>
          <NewTimelineEntrySheet matterId={matterId} />
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-6 text-center sm:p-8">
            <Clock className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2 sm:h-12 sm:w-12 sm:mb-3" />
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              Timeline entries will appear here once hearings or updates are recorded.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {entries.map((entry, index) => {
              const formattedDate = format(new Date(entry.date), "dd MMM yyyy");
              const formattedHearing = entry.hearingDate
                ? format(new Date(entry.hearingDate), "dd MMM yyyy")
                : null;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    "group relative rounded-xl border-2 bg-gradient-to-br p-4 shadow-sm transition-all duration-300 sm:rounded-2xl sm:p-5",
                    "hover:scale-[1.01] hover:shadow-md",
                    index === 0
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/60 bg-background/70",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0 sm:h-10 sm:w-10">
                        <Calendar className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                          {formattedDate}
                        </p>
                        {entry.stage ? (
                          <h3 className="mt-0.5 text-sm font-semibold text-foreground truncate sm:mt-1 sm:text-base">{entry.stage}</h3>
                        ) : (
                          <h3 className="mt-0.5 text-sm font-semibold text-foreground sm:mt-1 sm:text-base">Update</h3>
                        )}
                      </div>
                    </div>
                    {entry.courtName && (
                      <Badge variant="outline" className="capitalize text-[10px] sm:text-xs flex-shrink-0">
                        <MapPin className="mr-1 h-2.5 w-2.5 sm:mr-1.5 sm:h-3 sm:w-3" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{entry.courtName}</span>
                      </Badge>
                    )}
                  </div>

                  <Separator className="my-3 sm:my-4" />

                  <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line mb-3 sm:text-sm sm:mb-4">
                    {entry.details}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground sm:gap-4 sm:text-xs">
                    {formattedHearing && (
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Clock className="h-3 w-3 flex-shrink-0 sm:h-3.5 sm:w-3.5" />
                        <span>Next hearing: <span className="font-semibold text-foreground">{formattedHearing}</span></span>
                      </div>
                    )}
                    {entry.updatedByName && (
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <User className="h-3 w-3 flex-shrink-0 sm:h-3.5 sm:w-3.5" />
                        <span>Updated by <span className="font-semibold text-foreground">{entry.updatedByName}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
