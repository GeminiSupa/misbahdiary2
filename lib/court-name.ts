import { COURT_NAME_OTHER_VALUE, pakistanCourtOptions } from "@/lib/constants/geo";

/** Split stored DB court name into dropdown value + optional custom text for "Other". */
export function splitCourtForForm(stored: string): { courtName: string; courtNameOther: string } {
  const s = stored?.trim() ?? "";
  if (!s) {
    return { courtName: "", courtNameOther: "" };
  }
  const list = pakistanCourtOptions as readonly string[];
  if (list.includes(s)) {
    return { courtName: s, courtNameOther: "" };
  }
  return { courtName: COURT_NAME_OTHER_VALUE, courtNameOther: s };
}

/** Value persisted on matters.court_name (never store the sentinel). */
export function resolveCourtNameForDb(courtName: string, courtNameOther?: string | null): string {
  if (courtName === COURT_NAME_OTHER_VALUE) {
    return (courtNameOther ?? "").trim();
  }
  return courtName.trim();
}
