export const matterStatusOptions = [
  { value: "fresh diary", label: "Fresh Diary" },
  { value: "pending", label: "Pending" },
  { value: "execution", label: "Execution" },
  { value: "revision", label: "Revision" },
  { value: "review", label: "Review" },
  { value: "appeal", label: "Appeal" },
] as const;

export const matterTypeOptions = [
  { value: "advisory", label: "Advisory" },
  { value: "litigation", label: "Litigation" },
  { value: "mediation", label: "Mediation" },
] as const;

export const matterCaseTypeOptions = [
  { value: "civil", label: "Civil" },
  { value: "criminal", label: "Criminal" },
  { value: "corporate", label: "Corporate" },
  { value: "other", label: "Other" },
] as const;

export const matterPartyTypeOptions = [
  { value: "individual", label: "Individual" },
  { value: "organization", label: "Organization" },
  { value: "state", label: "State" },
] as const;

export type MatterStatusOption = (typeof matterStatusOptions)[number]["value"];
export type MatterTypeOption = (typeof matterTypeOptions)[number]["value"];
export type MatterCaseTypeOption = (typeof matterCaseTypeOptions)[number]["value"];
export type MatterPartyTypeOption = (typeof matterPartyTypeOptions)[number]["value"];

