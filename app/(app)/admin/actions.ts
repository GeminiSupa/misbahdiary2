"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
        subscription_status: string;
        subscription_ends_at: string | null;
        trial_ends_at: string | null;
      }>;
    }
  | ActionState
> {
  const adminCheck = await verifySuperAdmin();
  if ("message" in adminCheck) {
    return adminCheck;
  }

  const { supabaseAdminClient } = await import("@/lib/supabase/admin");

  // Use admin client to bypass RLS - super admins need to see ALL firms
  const { data: firms, error } = await supabaseAdminClient
    .from("firms")
    .select("id, name, contact_email, owner_id, created_at, subscription_status, subscription_ends_at, trial_ends_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { message: `Failed to fetch firms: ${error.message}` };
  }

  const ownerIds = [...new Set((firms ?? []).map((f) => f.owner_id).filter(Boolean) as string[])];
  const ownerNames: Record<string, string | null> = {};

  if (ownerIds.length > 0) {
    const { data: profiles } = await supabaseAdminClient
      .from("profiles")
      .select("id, full_name")
      .in("id", ownerIds);
    for (const p of profiles ?? []) {
      ownerNames[p.id] = p.full_name ?? null;
    }
  }

  return {
    firms:
      firms?.map((firm) => ({
        id: firm.id,
        name: firm.name,
        contact_email: firm.contact_email,
        owner_id: firm.owner_id,
        created_at: firm.created_at,
        owner_name: firm.owner_id ? ownerNames[firm.owner_id] ?? null : null,
        subscription_status: firm.subscription_status ?? "trial",
        subscription_ends_at: firm.subscription_ends_at ?? null,
        trial_ends_at: firm.trial_ends_at ?? null,
      })) ?? [],
  };
}

/**
 * List all users (profiles) with firm and subscription info (super admin only)
 */
export async function listAllUsers(): Promise<
  | {
      users: Array<{
        id: string;
        full_name: string | null;
        email: string | null;
        role: string | null;
        firm_id: string | null;
        firm_name: string | null;
        is_firm_owner: boolean;
        subscription_status: string | null;
        subscription_ends_at: string | null;
        trial_ends_at: string | null;
        created_at: string;
      }>;
    }
  | ActionState
> {
  const adminCheck = await verifySuperAdmin();
  if ("message" in adminCheck) {
    return adminCheck;
  }

  const { supabaseAdminClient } = await import("@/lib/supabase/admin");

  const { data: profiles, error } = await supabaseAdminClient
    .from("profiles")
    .select("id, full_name, role, firm_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return { message: `Failed to fetch users: ${error.message}` };
  }

  const firmIds = [...new Set((profiles ?? []).map((p) => p.firm_id).filter(Boolean) as string[])];
  const firmsData: Record<
    string,
    { name: string; owner_id: string | null; subscription_status: string | null; subscription_ends_at: string | null; trial_ends_at: string | null }
  > = {};

  if (firmIds.length > 0) {
    const { data: firms } = await supabaseAdminClient
      .from("firms")
      .select("id, name, owner_id, subscription_status, subscription_ends_at, trial_ends_at")
      .in("id", firmIds);
    for (const f of firms ?? []) {
      firmsData[f.id] = {
        name: f.name,
        owner_id: f.owner_id,
        subscription_status: f.subscription_status ?? null,
        subscription_ends_at: f.subscription_ends_at ?? null,
        trial_ends_at: f.trial_ends_at ?? null,
      };
    }
  }

  const emails: Record<string, string | null> = {};
  let page = 1;
  const perPage = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data } = await supabaseAdminClient.auth.admin.listUsers({ page, perPage });
    for (const u of data.users ?? []) {
      if (u.email) emails[u.id] = u.email;
    }
    hasMore = (data.users?.length ?? 0) === perPage;
    page++;
  }

  return {
    users:
      profiles?.map((p) => {
        const firm = p.firm_id ? firmsData[p.firm_id] : null;
        const isFirmOwner = firm?.owner_id === p.id;
        return {
          id: p.id,
          full_name: p.full_name ?? null,
          email: emails[p.id] ?? null,
          role: p.role ?? null,
          firm_id: p.firm_id ?? null,
          firm_name: firm?.name ?? null,
          is_firm_owner: isFirmOwner,
          subscription_status: isFirmOwner ? firm?.subscription_status ?? null : null,
          subscription_ends_at: isFirmOwner ? firm?.subscription_ends_at ?? null : null,
          trial_ends_at: isFirmOwner ? firm?.trial_ends_at ?? null : null,
          created_at: p.created_at,
        };
      }) ?? [],
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

  const { supabaseAdminClient } = await import("@/lib/supabase/admin");

  // Get firm using admin client to bypass RLS
  const { data: firm, error: firmError } = await supabaseAdminClient
    .from("firms")
    .select("id, name, contact_email, contact_phone, address, owner_id, created_at")
    .eq("id", firmId)
    .single();

  if (firmError || !firm) {
    return { message: "Firm not found" };
  }

  let ownerName: string | null = null;
  if (firm.owner_id) {
    const { data: ownerProfile } = await supabaseAdminClient
      .from("profiles")
      .select("full_name")
      .eq("id", firm.owner_id)
      .maybeSingle();
    ownerName = ownerProfile?.full_name ?? null;
  }

  // Get counts
  const [teamCount, matterCount, clientCount] = await Promise.all([
    supabaseAdminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firmId),
    supabaseAdminClient
      .from("matters")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firmId),
    supabaseAdminClient
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firmId),
  ]);

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
      owner_name: ownerName,
      owner_email: ownerEmail,
      team_member_count: teamCount.count ?? 0,
      matter_count: matterCount.count ?? 0,
      client_count: clientCount.count ?? 0,
    },
  };
}

/**
 * Record a cash subscription payment and activate/extend a firm's subscription.
 * Super admin only. Use when a customer pays via cash and you need to update their subscription.
 */
export async function recordCashSubscriptionPayment(
  firmId: string,
  billingInterval: "monthly" | "yearly" = "monthly",
  amount?: number,
  paymentReference?: string,
): Promise<ActionState> {
  const adminCheck = await verifySuperAdmin();
  if (!("userId" in adminCheck)) {
    return adminCheck as ActionState;
  }
  const { userId } = adminCheck;

  const { supabaseAdminClient } = await import("@/lib/supabase/admin");

  // Fetch firm with plan
  const { data: firm, error: firmError } = await supabaseAdminClient
    .from("firms")
    .select("id, name, subscription_plan_id, subscription_status, subscription_started_at, subscription_ends_at, contact_email")
    .eq("id", firmId)
    .single();

  if (firmError || !firm) {
    return { message: "Firm not found." };
  }

  // Get plan for amount and history
  let plan: { id: string; name?: string; price_monthly?: number | null; price_yearly?: number | null } | null = null;
  if (firm.subscription_plan_id) {
    const { data: planData } = await supabaseAdminClient
      .from("subscription_plans")
      .select("id, name, price_monthly, price_yearly")
      .eq("id", firm.subscription_plan_id)
      .maybeSingle();
    plan = planData;
  }
  if (!plan) {
    const { data: defaultPlan } = await supabaseAdminClient
      .from("subscription_plans")
      .select("id, name, price_monthly, price_yearly")
      .eq("name", "Professional Plan")
      .eq("is_active", true)
      .maybeSingle();
    plan = defaultPlan;
  }

  const daysToAdd = billingInterval === "yearly" ? 365 : 30;
  const amountPaid =
    amount ?? (billingInterval === "yearly" ? Number(plan?.price_yearly ?? plan?.price_monthly ?? 0) * 12 : Number(plan?.price_monthly ?? 0));

  const now = new Date();
  let subscriptionStartedAt: string;
  let subscriptionEndsAt: Date;

  // If already active and subscription_ends_at is in the future, extend from that date
  const currentEndsAt = firm.subscription_ends_at ? new Date(firm.subscription_ends_at) : null;
  if (
    firm.subscription_status === "active" &&
    currentEndsAt &&
    currentEndsAt > now
  ) {
    subscriptionStartedAt = firm.subscription_started_at ?? now.toISOString();
    subscriptionEndsAt = new Date(currentEndsAt);
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + daysToAdd);
  } else {
    subscriptionStartedAt = now.toISOString();
    subscriptionEndsAt = new Date(now);
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + daysToAdd);
  }

  const { error: updateError } = await supabaseAdminClient
    .from("firms")
    .update({
      subscription_status: "active",
      subscription_started_at: subscriptionStartedAt,
      subscription_ends_at: subscriptionEndsAt.toISOString(),
    })
    .eq("id", firmId);

  if (updateError) {
    return { message: `Failed to update subscription: ${updateError.message}` };
  }

  await supabaseAdminClient.from("subscription_history").insert({
    firm_id: firmId,
    subscription_plan_id: plan?.id ?? null,
    status: "subscribed",
    amount_paid: amountPaid,
    currency: "PKR",
    payment_method: "cash",
    payment_reference: paymentReference || null,
    event_data: {
      billing_interval: billingInterval,
      days_added: daysToAdd,
      recorded_by: userId,
      recorded_at: now.toISOString(),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/firms");
  return { success: true };
}
