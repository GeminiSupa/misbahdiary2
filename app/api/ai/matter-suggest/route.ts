import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  notes: z.string().min(12, "Add a bit more detail for useful suggestions."),
});

const suggestionKeys = [
  "clientBrief",
  "againstParties",
  "caseNumber",
  "suggestedCourtName",
  "suggestedDistrict",
] as const;

type Suggestions = Partial<Record<(typeof suggestionKeys)[number], string>>;

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.flatten().fieldErrors.notes?.[0] ?? "Invalid input." },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json({
      configured: false,
      message: "Configure OPENAI_API_KEY in the server environment to enable AI suggestions.",
    });
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const system = `You help Pakistani lawyers draft matter intake fields from rough notes.
Return a single JSON object with these optional string keys (omit a key if unknown):
- clientBrief: 2–6 sentences summarizing the client's position and relief sought
- againstParties: short identification of opposing party/parties (names or description)
- caseNumber: court case number if mentioned (e.g. 123/2024), else omit
- suggestedCourtName: exact common name of court if inferable (e.g. "Sindh High Court", "Lahore High Court"), else omit
- suggestedDistrict: Pakistan district name if inferable (e.g. "Karachi", "Lahore"), else omit
Use British/legal English where natural. Do not invent case numbers or courts; omit if unsure.`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: parsed.data.notes },
        ],
      }),
    });

    const raw = (await openaiRes.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!openaiRes.ok) {
      const msg = raw.error?.message ?? "OpenAI request failed.";
      return NextResponse.json({ message: msg }, { status: 502 });
    }

    const content = raw.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return NextResponse.json({ message: "No content from model." }, { status: 502 });
    }

    let obj: unknown;
    try {
      obj = JSON.parse(content) as unknown;
    } catch {
      return NextResponse.json({ message: "Could not parse model output." }, { status: 502 });
    }

    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      return NextResponse.json({ message: "Invalid suggestion shape." }, { status: 502 });
    }

    const suggestions: Suggestions = {};
    const record = obj as Record<string, unknown>;
    for (const key of suggestionKeys) {
      const v = record[key];
      if (typeof v === "string" && v.trim()) {
        suggestions[key] = v.trim();
      }
    }

    return NextResponse.json({
      configured: true,
      suggestions,
    });
  } catch (e) {
    console.error("matter-suggest:", e);
    return NextResponse.json({ message: "Suggestion request failed." }, { status: 500 });
  }
}
