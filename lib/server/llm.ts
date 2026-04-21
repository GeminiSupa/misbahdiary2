type JsonObject = Record<string, unknown>;

export type GenerateJsonOptions = {
  system: string;
  user: string;
  /**
   * Defaults to `process.env.GROQ_MODEL` or a sensible Groq model.
   * Note: this endpoint uses Groq's OpenAI-compatible API.
   */
  model?: string;
  temperature?: number;
};

function groqApiKey(): string | null {
  const key = process.env.GROQ_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function isGroqConfigured(): boolean {
  return Boolean(groqApiKey());
}

function defaultGroqModel(): string {
  return process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant";
}

export async function generateJson<T extends JsonObject = JsonObject>(
  options: GenerateJsonOptions,
): Promise<{ ok: true; data: T } | { ok: false; message: string; status?: number }> {
  const apiKey = groqApiKey();
  if (!apiKey) {
    return {
      ok: false,
      message: "Configure GROQ_API_KEY in the server environment to enable AI drafting.",
    };
  }

  const model = options.model?.trim() || defaultGroqModel();
  const temperature = typeof options.temperature === "number" ? options.temperature : 0.2;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.user },
        ],
      }),
    });

    const raw = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
    };

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: raw.error?.message || "Groq request failed.",
      };
    }

    const content = raw.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return { ok: false, message: "No content from model." };
    }

    let obj: unknown;
    try {
      obj = JSON.parse(content) as unknown;
    } catch {
      return { ok: false, message: "Could not parse model output." };
    }

    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      return { ok: false, message: "Invalid JSON object returned by model." };
    }

    return { ok: true, data: obj as T };
  } catch (e) {
    console.error("groq-generateJson:", e);
    return { ok: false, message: "Drafting request failed." };
  }
}

