import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type MatterRow = Database["public"]["Tables"]["matters"]["Row"];

/** Display line for a matter on the client portal (matches firm-side serial + references). */
export function formatMatterPortalTitle(m: Pick<MatterRow, "serial_number" | "case_number" | "case_type" | "case_type_other">): string {
  const parts: string[] = [m.serial_number];
  if (m.case_number?.trim()) parts.push(m.case_number.trim());
  if (m.case_type === "other" && m.case_type_other?.trim()) {
    parts.push(m.case_type_other.trim());
  } else if (m.case_type) {
    parts.push(m.case_type);
  }
  return parts.join(" · ");
}

export async function fetchPortalMatterIds(
  supabase: SupabaseClient<Database>,
  clientId: string,
): Promise<string[]> {
  const { data, error } = await supabase.from("matters").select("id").eq("client_id", clientId);

  if (error) {
    throw new Error(`Failed to resolve matters: ${error.message}`);
  }

  return (data ?? []).map((row) => row.id);
}

export async function fetchPortalLegacyCaseIds(
  supabase: SupabaseClient<Database>,
  clientId: string,
): Promise<string[]> {
  const { data, error } = await supabase.from("cases").select("id").eq("client_id", clientId);

  if (error) {
    throw new Error(`Failed to resolve legacy cases: ${error.message}`);
  }

  return (data ?? []).map((row) => row.id);
}
