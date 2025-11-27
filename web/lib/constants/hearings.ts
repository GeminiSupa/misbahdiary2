export const hearingStatusOptions = [
  { value: "scheduled", label: "Scheduled" },
  { value: "adjourned", label: "Adjourned" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export type HearingStatusOption = (typeof hearingStatusOptions)[number]["value"];

