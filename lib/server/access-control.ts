"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Get user's role in a firm
 */
export async function getUserRole(
  userId: string,
  firmId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .eq("firm_id", firmId)
    .maybeSingle();

  return profile?.role ?? null;
}

/**
 * Check if user is a firm owner
 */
export async function isFirmOwner(
  userId: string,
  firmId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: firm } = await supabase
    .from("firms")
    .select("owner_id")
    .eq("id", firmId)
    .maybeSingle();

  return firm?.owner_id === userId;
}

/**
 * Check if user can see all cases in a firm
 * Returns true for firm owners and principal partners
 */
export async function canUserSeeAllCases(
  userId: string,
  firmId: string,
): Promise<boolean> {
  const isOwner = await isFirmOwner(userId, firmId);
  if (isOwner) {
    return true;
  }

  const role = await getUserRole(userId, firmId);
  return role === "principal_partner";
}

/**
 * Get list of matter IDs that a user can see based on their role
 * Returns all matter IDs if user can see all cases, otherwise returns filtered list
 */
export async function getUserVisibleMatterIds(
  userId: string,
  firmId: string,
): Promise<string[]> {
  const supabase = await createSupabaseServerClient();

  // If user can see all cases, return all matter IDs
  if (await canUserSeeAllCases(userId, firmId)) {
    const { data: allMatters } = await supabase
      .from("matters")
      .select("id")
      .eq("firm_id", firmId);

    return allMatters?.map((m) => m.id) ?? [];
  }

  const role = await getUserRole(userId, firmId);

  // Associates and of_counsel can see matters they created OR are assigned to
  if (role === "associate" || role === "of_counsel") {
    const { data: matters } = await supabase
      .from("matters")
      .select("id")
      .eq("firm_id", firmId)
      .or(`created_by.eq.${userId},assigned_attorneys.cs.{${userId}}`);

    return matters?.map((m) => m.id) ?? [];
  }

  // Paralegals and staff can only see assigned matters
  if (role === "paralegal" || role === "staff") {
    const { data: matters } = await supabase
      .from("matters")
      .select("id")
      .eq("firm_id", firmId)
      .contains("assigned_attorneys", [userId]);

    return matters?.map((m) => m.id) ?? [];
  }

  // Default: return empty array
  return [];
}

/**
 * Check if user is a super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .maybeSingle();

  // Type assertion needed - is_super_admin column not in TypeScript types yet
  const profileData = profile as { is_super_admin?: boolean } | null;
  return profileData?.is_super_admin === true;
}
