"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createFirmSchema, type CreateFirmSchema } from "@/lib/validation/admin";
import { isSuperAdmin } from "@/lib/server/access-control";

type ActionState = {
  success?: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Verify that the current user is a super admin
 */
async function verifySuperAdmin(): Promise<{ userId: string } | ActionState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  const isAdmin = await isSuperAdmin(user.id);
  if (!isAdmin) {
    return {
      message: "Access denied. Super admin privileges required.",
    };
  }

  return { userId: user.id };
}

/**
 * Create a new firm with a firm owner
 */
export async function createFirmWithOwner(
  values: CreateFirmSchema,
): Promise<ActionState> {
  const adminCheck = await verifySuperAdmin();
  if ("message" in adminCheck) {
    return adminCheck;
  }

  const parsed = createFirmSchema.safeParse(values);
  if (!parsed.success) {
    return {
      message: "Please review the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { supabaseAdminClient } = await import("@/lib/supabase/admin");

  // Check if firm owner email already exists
  const { data: existingUsers } = await supabaseAdminClient.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(
    (u) => u.email?.toLowerCase() === parsed.data.ownerEmail.toLowerCase(),
  );

  if (existingUser) {
    return { message: "A user with this email already exists." };
  }

  try {
    // Create firm owner user account
    const { data: newUser, error: createError } = await supabaseAdminClient.auth.admin.createUser({
      email: parsed.data.ownerEmail,
      password: parsed.data.ownerPassword,
      email_confirm: true,
      user_metadata: {
        role: "principal_partner",
        full_name: parsed.data.ownerFullName,
      },
    });

    if (createError || !newUser.user) {
      return {
        message: createError?.message || "Failed to create firm owner account",
      };
    }

    // Calculate trial dates (30 days from now)
    const trialStartedAt = new Date();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // Get the default subscription plan (Professional Plan)
    const { data: defaultPlan } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("name", "Professional Plan")
      .eq("is_active", true)
      .maybeSingle();

    // Create the firm with trial setup
    const { data: firm, error: firmError } = await supabase
      .from("firms")
      .insert({
        name: parsed.data.firmName,
        contact_email: parsed.data.contactEmail,
        contact_phone: parsed.data.contactPhone || null,
        address: parsed.data.address || null,
        owner_id: newUser.user.id,
        locale: "en-PK",
        timezone: "Asia/Karachi",
        subscription_status: "trial",
        subscription_plan_id: defaultPlan?.id || null,
        trial_started_at: trialStartedAt.toISOString(),
        trial_ends_at: trialEndsAt.toISOString(),
      })
      .select("id")
      .single();

    if (firmError || !firm) {
      // Rollback: delete the user if firm creation fails
      await supabaseAdminClient.auth.admin.deleteUser(newUser.user.id);
      return {
        message: firmError?.message || "Failed to create firm",
      };
    }

    // Update profile with firm_id and role
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        firm_id: firm.id,
        role: "principal_partner",
        full_name: parsed.data.ownerFullName,
      })
      .eq("id", newUser.user.id);

    if (profileError) {
      // Try inserting if update fails
      const { error: insertError } = await supabase.from("profiles").insert({
        id: newUser.user.id,
        firm_id: firm.id,
        role: "principal_partner",
        full_name: parsed.data.ownerFullName,
      });

      if (insertError) {
        console.error("Failed to create/update profile after firm creation:", insertError);
        return {
          message: "Firm and user were created but profile setup failed. Please contact support.",
        };
      }
    }

    // Log trial start in subscription history
    const { error: historyError } = await supabase
      .from("subscription_history")
      .insert({
        firm_id: firm.id,
        subscription_plan_id: defaultPlan?.id || null,
        status: "trial_started",
        event_data: {
          trial_started_at: trialStartedAt.toISOString(),
          trial_ends_at: trialEndsAt.toISOString(),
        },
      });
    
    if (historyError) {
      console.error("Failed to log trial start in subscription history:", historyError);
      // Don't fail the firm creation if history logging fails
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating firm with owner:", error);
    return {
      message: error instanceof Error ? error.message : "Failed to create firm",
    };
  }
}

/**
 * List all firms (super admin only)
 */
export async function listAllFirms(): Promise<
  | {
      firms: Array<{
        id: string;
        name: string;
        contact_email: string | null;
        owner_id: string | null;
        created_at: string;
        owner_name: string | null;
      }>;
    }
  | ActionState
> {
  const adminCheck = await verifySuperAdmin();
  if ("message" in adminCheck) {
    return adminCheck;
  }

  const supabase = await createSupabaseServerClient();
  const { supabaseAdminClient } = await import("@/lib/supabase/admin");

  // Get all firms with owner information
  const { data: firms, error } = await supabase
    .from("firms")
    .select(
      `
      id,
      name,
      contact_email,
      owner_id,
      created_at,
      owner:profiles!firms_owner_id_fkey (
        full_name
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { message: `Failed to fetch firms: ${error.message}` };
  }

  return {
    firms:
      firms?.map((firm) => ({
        id: firm.id,
        name: firm.name,
        contact_email: firm.contact_email,
        owner_id: firm.owner_id,
        created_at: firm.created_at,
        owner_name: (firm.owner as { full_name?: string | null } | null)?.full_name ?? null,
      })) ?? [],
  };
}

/**
 * Get firm details (super admin only)
 */
export async function getFirmDetails(
  firmId: string,
): Promise<
  | {
      firm: {
        id: string;
        name: string;
        contact_email: string | null;
        contact_phone: string | null;
        address: string | null;
        owner_id: string | null;
        created_at: string;
        owner_name: string | null;
        owner_email: string | null;
        team_member_count: number;
        matter_count: number;
        client_count: number;
      };
    }
  | ActionState
> {
  const adminCheck = await verifySuperAdmin();
  if ("message" in adminCheck) {
    return adminCheck;
  }

  const supabase = await createSupabaseServerClient();
  const { supabaseAdminClient } = await import("@/lib/supabase/admin");

  // Get firm with owner information
  // Note: We can't directly query auth.users, so we'll get owner info from profiles
  const { data: firm, error: firmError } = await supabase
    .from("firms")
    .select(
      `
      id,
      name,
      contact_email,
      contact_phone,
      address,
      owner_id,
      created_at,
      owner:profiles!firms_owner_id_fkey (
        full_name
      )
    `,
    )
    .eq("id", firmId)
    .single();

  if (firmError || !firm) {
    return { message: "Firm not found" };
  }

  // Get counts
  const [teamCount, matterCount, clientCount] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firmId),
    supabase
      .from("matters")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firmId),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firmId),
  ]);

  const owner = firm.owner as { full_name?: string | null } | null;

  // Get owner email from auth.users using admin client
  let ownerEmail: string | null = null;
  if (firm.owner_id) {
    const { data: authUser } = await supabaseAdminClient.auth.admin.getUserById(firm.owner_id);
    ownerEmail = authUser?.user?.email ?? null;
  }

  return {
    firm: {
      id: firm.id,
      name: firm.name,
      contact_email: firm.contact_email,
      contact_phone: firm.contact_phone,
      address: firm.address,
      owner_id: firm.owner_id,
      created_at: firm.created_at,
      owner_name: owner?.full_name ?? null,
      owner_email: ownerEmail,
      team_member_count: teamCount.count ?? 0,
      matter_count: matterCount.count ?? 0,
      client_count: clientCount.count ?? 0,
    },
  };
}
