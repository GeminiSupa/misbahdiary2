import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ running: null, totalMinutesToday: 0 });
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const firmId = await getFirmId(supabase, user.id);
  if (!firmId) {
    return NextResponse.json({ running: null, totalMinutesToday: 0 });
  }

  const { data: runningEntry } = await supabase
    .from("time_entries")
    .select("id, started_at, description, matter_id")
    .eq("user_id", user.id)
    .eq("firm_id", firmId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: todayEntries } = await supabase
    .from("time_entries")
    .select("duration_minutes, started_at, ended_at")
    .eq("user_id", user.id)
    .eq("firm_id", firmId)
    .gte("started_at", startOfDay.toISOString());

  const totalMinutesToday =
    todayEntries?.reduce((sum, entry) => {
      if (entry.duration_minutes != null) return sum + entry.duration_minutes;
      if (entry.started_at && !entry.ended_at) {
        const started = new Date(entry.started_at);
        return sum + Math.floor((now.getTime() - started.getTime()) / 60000);
      }
      return sum;
    }, 0) ?? 0;

  return NextResponse.json({
    running: runningEntry
      ? {
          id: runningEntry.id,
          startedAt: runningEntry.started_at,
          description: runningEntry.description,
          matterId: runningEntry.matter_id,
        }
      : null,
    totalMinutesToday,
  });
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = body?.action as "start" | "stop" | undefined;
  const matterId = body?.matterId as string | null | undefined;
  const description = body?.description as string | null | undefined;

  if (!action) {
    return NextResponse.json({ error: "Action is required (start or stop)" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Auth error in timer API:", authError);
    return NextResponse.json(
      { error: `Authentication failed: ${authError.message}` },
      { status: 401 }
    );
  }

  if (!user) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  const firmId = await getFirmId(supabase, user.id);
  if (!firmId) {
    return NextResponse.json({ error: "User is not linked to a firm" }, { status: 400 });
  }

  const now = new Date();

  if (action === "start") {
    // Ensure no active entry
    await supabase
      .from("time_entries")
      .update({
        ended_at: now.toISOString(),
      })
      .eq("user_id", user.id)
      .eq("firm_id", firmId)
      .is("ended_at", null);

    // Validate matter_id if provided
    if (matterId) {
      const { data: matter } = await supabase
        .from("matters")
        .select("id, firm_id")
        .eq("id", matterId)
        .eq("firm_id", firmId)
        .maybeSingle();

      if (!matter) {
        return NextResponse.json({ error: "Matter not found or access denied" }, { status: 400 });
      }
    }

    const { data, error: insertError } = await supabase
      .from("time_entries")
      .insert({
        firm_id: firmId,
        user_id: user.id,
        matter_id: matterId || null,
        description: description?.trim() || null,
        started_at: now.toISOString(),
        billable: true,
      })
      .select("id, started_at, matter_id, description")
      .single();

    if (insertError || !data) {
      return NextResponse.json({ error: insertError?.message ?? "Unable to start timer" }, { status: 500 });
    }

    return NextResponse.json({
      running: {
        id: data.id,
        startedAt: data.started_at,
        matterId: data.matter_id,
        description: data.description,
      },
    });
  }

  // action === "stop"
  const { data: runningEntry, error: fetchError } = await supabase
    .from("time_entries")
    .select("id, started_at, billing_rate")
    .eq("user_id", user.id)
    .eq("firm_id", firmId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !runningEntry) {
    return NextResponse.json({ running: null });
  }

  const startedAt = new Date(runningEntry.started_at);
  const durationMinutes = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 60000));

  const amount =
    runningEntry.billing_rate != null
      ? Number(runningEntry.billing_rate) * (durationMinutes / 60)
      : null;

  const { error: updateError } = await supabase
    .from("time_entries")
    .update({
      ended_at: now.toISOString(),
      duration_minutes: durationMinutes,
      amount,
    })
    .eq("id", runningEntry.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ running: null });
}

async function getFirmId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", userId)
    .maybeSingle();
  return profile?.firm_id ?? null;
}


