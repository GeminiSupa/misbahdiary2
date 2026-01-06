import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type NotificationPreferenceKey =
  | "hearing_reminders"
  | "invoice_reminders"
  | "announcement_updates";

export async function getRecipientIdsForPreference(
  supabase: SupabaseClient<Database>,
  firmId: string,
  preference: NotificationPreferenceKey,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
        id,
        notification_preferences!inner (
          hearing_reminders,
          invoice_reminders,
          announcement_updates
        )
      `,
    )
    .eq("firm_id", firmId)
    .eq(`notification_preferences.${preference}`, true);

  if (error || !data) {
    return [];
  }

  return data.map((member) => member.id);
}

