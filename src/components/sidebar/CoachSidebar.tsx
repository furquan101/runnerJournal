import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useEntries } from "@/store/useEntries";
import { usePlan } from "@/store/usePlan";
import { useSettings } from "@/store/useSettings";
import { MissingApiKeyError, streamCoachInsights } from "@/lib/openrouter";
import { localInsight } from "@/lib/insights";

export function CoachSidebar() {
  const entriesMap = useEntries((s) => s.entries);
  const plan = usePlan((s) => s.plan);
  const apiKey = useSettings((s) => s.openRouterKey);

  const recentEntries = useMemo(
    () => Object.values(entriesMap).sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1)),
    [entriesMap],
  );

  const [streamed, setStreamed] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [question, setQuestion] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const fallback = useMemo(() => localInsight(recentEntries, plan), [recentEntries, plan]);

  const ask = async (userMessage: string | null) => {
    abortRef.current?.abort();
    if (!apiKey) {
      setError(null);
      setStreamed("");
      return;
    }
    const ctl = new AbortController();
    abortRef.current = ctl;
    setPending(true);
    setError(null);
    setStreamed("");
    try {
      await streamCoachInsights({
        apiKey,
        recentEntries,
        plan,
        userMessage,
        signal: ctl.signal,
        onToken: (chunk) => setStreamed((s) => s + chunk),
      });
    } catch (e) {
      if (ctl.signal.aborted) return;
      if (e instanceof MissingApiKeyError) {
        setError("Add an OpenRouter key in Connections to talk to your coach.");
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      if (abortRef.current === ctl) {
        setPending(false);
        abortRef.current = null;
      }
    }
  };

  useEffect(() => {
    void ask(null);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    setQuestion("");
    void ask(q);
  };

  const showFallback = !apiKey && !streamed;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
        <h2 className="text-3xl font-normal text-black">Coach insights:</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="whitespace-pre-wrap text-sm leading-[1.6] text-black/80">
          {showFallback ? fallback : streamed}
          {pending && <span className="opacity-50">…</span>}
        </p>
      </div>
      <form
        onSubmit={onSend}
        className="mt-2 flex h-[51px] shrink-0 items-center gap-2 rounded-[12px] border border-neutral-200 bg-white px-3 shadow-sm"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={apiKey ? "Ask your coach…" : "Add an API key in Connections"}
          disabled={!apiKey || pending}
          className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
        />
        <button
          type="submit"
          disabled={!apiKey || pending || !question.trim()}
          className="grid size-8 place-items-center rounded-full bg-black text-white transition disabled:opacity-30"
          aria-label="Send"
        >
          <ArrowUp className="size-4" />
        </button>
      </form>
    </div>
  );
}
