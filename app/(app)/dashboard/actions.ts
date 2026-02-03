"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DashboardWidget } from "@/lib/types/dashboard";

type ActionState = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

export async function saveDashboardPreferences(
  widgets: DashboardWidget[]
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return { message: "User not associated with a firm." };
  }

  // Delete existing preferences
  await (supabase as any)
    .from("dashboard_preferences")
    .delete()
    .eq("user_id", user.id);

  // Insert new preferences
  const preferences = widgets.map((widget) => ({
    user_id: user.id,
    firm_id: profile.firm_id,
    widget_id: widget.id,
    widget_type: widget.type,
    position: widget.position,
    size: widget.size,
    color_scheme: widget.colorScheme ? JSON.stringify(widget.colorScheme) : null,
    typography: widget.typography ? JSON.stringify(widget.typography) : null,
    is_visible: widget.isVisible,
    custom_config: widget.customConfig || null,
  }));

  const { error } = await (supabase as any)
    .from("dashboard_preferences")
    .insert(preferences);

  if (error) {
    console.error("Error saving dashboard preferences:", error);
    return {
      message: error.message || "Failed to save dashboard preferences",
    };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getDashboardPreferences(): Promise<{
  widgets: DashboardWidget[];
} | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: preferences, error } = await (supabase as any)
    .from("dashboard_preferences")
    .select("*")
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching dashboard preferences:", error);
    return null;
  }

  if (!preferences || preferences.length === 0) {
    return null;
  }

  const widgets: DashboardWidget[] = preferences.map((pref: any) => ({
    id: pref.widget_id,
    type: pref.widget_type as DashboardWidget["type"],
    position: pref.position,
    size: pref.size as DashboardWidget["size"],
    colorScheme: pref.color_scheme ? JSON.parse(pref.color_scheme) : undefined,
    typography: pref.typography ? JSON.parse(pref.typography) : undefined,
    isVisible: pref.is_visible,
    customConfig: pref.custom_config,
  }));

  return { widgets };
}
