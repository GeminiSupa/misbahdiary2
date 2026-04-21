import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateJson, isGroqConfigured } from "@/lib/server/llm";

const templateTypes = [
  "generic",
  "civil_plaint",
  "writ_petition",
  "bail_application",
  "criminal_complaint",
  "appeal_memo",
] as const;

const bodySchema = z.object({
  notes: z.string().min(12, "Add a bit more detail for useful drafting."),
  templateType: z.enum(templateTypes).default("generic"),
  matterContext: z
    .object({
      clientName: z.string().optional(),
      courtName: z.string().optional(),
      district: z.string().optional(),
      caseNumber: z.string().optional(),
      matterType: z.string().optional(),
    })
    .optional(),
});

const suggestionKeys = [
  "clientBrief",
  "againstParties",
  "caseNumber",
  "suggestedCourtName",
  "suggestedDistrict",
] as const;

type Suggestions = Partial<Record<(typeof suggestionKeys)[number], string>>;

type DraftResponse = {
  suggestions?: Suggestions;
  draft?: string;
  outline?: string[];
  prayer?: string;
  grounds?: string[];
  checklist?: string[];
  questionsForClient?: string[];
  riskNotes?: string[];
  citations?: Array<{
    title: string;
    url: string;
    court?: string;
    date?: string;
    excerpt?: string;
  }>;
};

function templateHint(templateType: (typeof templateTypes)[number]): string {
  switch (templateType) {
    case "civil_plaint":
      return "Draft a Pakistani civil plaint / suit pleading (declaration/injunction/possession as appropriate). Use structured headings (Parties, Jurisdiction, Facts, Cause of Action, Relief/Prayer, Verification).";
    case "writ_petition":
      return "Draft a High Court constitutional writ petition in Pakistani style. Use structured headings (Parties, Synopsis, Facts, Questions of Law, Grounds, Prayer/Relief, Interim Relief if relevant).";
    case "bail_application":
      return "Draft a bail application in Pakistani criminal practice. Include concise facts, allegations, legal grounds, and prayer; include conditions/undertaking if appropriate.";
    case "criminal_complaint":
      return "Draft a criminal complaint / application related to FIR proceedings in Pakistani practice. Use headings, facts, legal provisions (only if stated/obvious), and relief.";
    case "appeal_memo":
      return "Draft an appeal memo/revision petition in Pakistani practice. Include impugned order/judgment reference, facts, grounds of appeal, and prayer.";
    default:
      return "Draft a generic case note + structured pleading-style draft with headings (Facts, Issues, Grounds, Prayer, Annexures).";
  }
}

function systemPrompt(templateType: (typeof templateTypes)[number]): string {
  return `You are an assistant for Pakistani lawyers. You help draft case documents and also suggest intake fields.

IMPORTANT RULES:
- Return ONLY a single JSON object. No markdown, no prose outside JSON.
- Do NOT invent citations, case numbers, dates, courts, or statute sections. If unsure, omit.
- Write in formal legal English used in Pakistan.
- Keep drafting practical and court-ready, but generic enough to be edited.
- Include a client question list when facts are missing.

OUTPUT SHAPE (all keys optional; omit unknowns):
- suggestions: { clientBrief, againstParties, caseNumber, suggestedCourtName, suggestedDistrict }
- draft: string (the full draft text with headings)
- outline: string[] (section headings used)
- grounds: string[] (bullet grounds)
- prayer: string (requested relief)
- checklist: string[] (annexures/filing checklist)
- questionsForClient: string[] (clarifications needed)
- riskNotes: string[] (procedural risks / missing facts)
- citations: [] (leave empty; do not add web citations)

TEMPLATE INSTRUCTIONS:
${templateHint(templateType)}`;
}

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
    const m = parsed.error.flatten().fieldErrors.notes?.[0] ?? "Invalid input.";
    return NextResponse.json({ message: m }, { status: 400 });
  }

  if (!isGroqConfigured()) {
    return NextResponse.json({
      configured: false,
      message: "Configure GROQ_API_KEY in the server environment to enable AI drafting.",
    });
  }

  const { notes, templateType, matterContext } = parsed.data;

  const userPromptParts: string[] = [];
  if (matterContext) {
    userPromptParts.push(
      `Context (may be incomplete): ${JSON.stringify(matterContext)}`,
    );
  }
  userPromptParts.push(`Lawyer notes:\n${notes}`);
  userPromptParts.push(
    "Now return the JSON object in the required shape. If you cannot draft, return {\"questionsForClient\":[...]} only.",
  );

  const result = await generateJson<DraftResponse>({
    system: systemPrompt(templateType),
    user: userPromptParts.join("\n\n"),
    temperature: 0.2,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status ?? 502 });
  }

  const obj = result.data ?? {};
  const out: DraftResponse = {};

  if (obj.suggestions && typeof obj.suggestions === "object" && !Array.isArray(obj.suggestions)) {
    const rec = obj.suggestions as Record<string, unknown>;
    const s: Suggestions = {};
    for (const key of suggestionKeys) {
      const v = rec[key];
      if (typeof v === "string" && v.trim()) s[key] = v.trim();
    }
    out.suggestions = s;
  }

  const str = (k: keyof DraftResponse) => {
    const v = obj[k];
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  };
  const strList = (k: keyof DraftResponse) => {
    const v = obj[k];
    if (!Array.isArray(v)) return undefined;
    const list = v.filter((x) => typeof x === "string" && x.trim()).map((x) => String(x).trim());
    return list.length > 0 ? list : undefined;
  };

  out.draft = str("draft");
  out.prayer = str("prayer");
  out.outline = strList("outline");
  out.grounds = strList("grounds");
  out.checklist = strList("checklist");
  out.questionsForClient = strList("questionsForClient");
  out.riskNotes = strList("riskNotes");
  out.citations = [];

  return NextResponse.json({ configured: true, ...out });
}

