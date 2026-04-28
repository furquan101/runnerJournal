import type { JournalEntry, Plan } from "@/types";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "anthropic/claude-sonnet-4-6";

export class MissingApiKeyError extends Error {
  constructor() {
    super("Missing OpenRouter API key");
    this.name = "MissingApiKeyError";
  }
}

function systemPrompt(plan: Plan | null): string {
  const ctx = plan
    ? `The runner is training for ${plan.target.race} on ${plan.target.raceDate}, goal time ${plan.target.goalTime}, training ${plan.target.trainingFreqPerWeek} days a week (${plan.target.preferredDays.join(", ")}).`
    : "The runner has not set a race goal yet.";
  return [
    "You are a marathon coach reading a runner's journal entries.",
    ctx,
    "Be warm, specific and short. Reflect what they said back to them in fresh language; surface concrete patterns when you spot them (e.g. 'you run better after good sleep'). Suggest one small thing for tomorrow. No bullet lists; write 2–3 short paragraphs.",
  ].join(" ");
}

function userPrompt(entries: JournalEntry[], userMessage: string | null): string {
  const recent = entries
    .slice(-7)
    .map((e) => `## ${e.dateISO}\n${e.body.trim() || "(no entry)"}`)
    .join("\n\n");
  const tail = userMessage ? `\n\nThe runner asks: ${userMessage}` : "";
  return `Here are my recent journal entries:\n\n${recent}${tail}`;
}

export async function streamCoachInsights(opts: {
  apiKey: string | null;
  recentEntries: JournalEntry[];
  plan: Plan | null;
  userMessage?: string | null;
  signal?: AbortSignal;
  onToken: (chunk: string) => void;
}): Promise<void> {
  if (!opts.apiKey) throw new MissingApiKeyError();

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "Runner Journal",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt(opts.plan) },
        { role: "user", content: userPrompt(opts.recentEntries, opts.userMessage ?? null) },
      ],
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter error ${res.status}: ${text || res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length > 0) opts.onToken(delta);
      } catch {
        // ignore malformed SSE
      }
    }
  }
}
