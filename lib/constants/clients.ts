export const clientTypeOptions = [
  { value: "individual", label: "Individual" },
  { value: "organization", label: "Organization" },
] as const;

export const clientRepresentationOptions = [
  { value: "self", label: "Self" },
  { value: "representative", label: "Representative" },
] as const;

export const representativeCapacityOptions = [
  { value: "third_party", label: "Third Party" },
  { value: "corporate", label: "Corporate" },
  { value: "government_dept", label: "Government Department" },
] as const;

export type ClientTypeOption = (typeof clientTypeOptions)[number]["value"];
export type ClientRepresentationOption =
  (typeof clientRepresentationOptions)[number]["value"];
export type RepresentativeCapacityOption =
  (typeof representativeCapacityOptions)[number]["value"];

