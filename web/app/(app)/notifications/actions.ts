"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function markNotificationRead(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .or(`user_id.is.null,user_id.eq.${user.id}`);

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/billing");
}

export async function markAllNotificationsRead() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null)
    .or(`user_id.is.null,user_id.eq.${user.id}`);

  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/billing");
}

