import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useEntries } from "@/store/useEntries";
import { usePlan } from "@/store/usePlan";
import { useSettings } from "@/store/useSettings";
import { useStrava } from "@/store/useStrava";
import { useOura } from "@/store/useOura";
import { COACH_NAME, MissingApiKeyError, streamCoachInsights } from "@/lib/openrouter";
import { localInsight } from "@/lib/insights";

const QUICK_QUESTIONS = [
  "Is my goal time realistic?",
  "What should my next run be?",
  "Why do some runs feel so hard?",
];

export function CoachSidebar() {
  const entriesMap = useEntries((s) => s.entries);
  const plan = usePlan((s) => s.plan);
  const apiKey = useSettings((s) => s.openRouterKey);
  const activities = useStrava((s) => s.activities);
  const nights = useOura((s) => Object.keys(s.days).length);

  const recentEntries = useMemo(
    () => Object.values(entriesMap).sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1)),
    [entriesMap],
  );
  const journaled = recentEntries.filter((e) => e.body.trim()).length;

  const [streamed, setStreamed] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [question, setQuestion] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const fallback = useMemo(
    () => localInsight(recentEntries, plan, activities),
    [recentEntries, plan, activities],
  );

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
    setAsked(userMessage);
    try {
      await streamCoachInsights({
        apiKey,
        recentEntries,
        plan,
        activities: useStrava.getState().activities,
        ouraDays: useOura.getState().days,
        userMessage,
        signal: ctl.signal,
        onToken: (chunk) => {
          if (!ctl.signal.aborted) setStreamed((s) => s + chunk);
        },
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void ask(null);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const send = (q: string) => {
    if (!q.trim() || pending) return;
    setQuestion("");
    void ask(q.trim());
  };

  const showFallback = !apiKey && !streamed;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-normal text-black">{COACH_NAME}</h2>
          <p className="text-xs opacity-60">
            Read {journaled.toLocaleString()} journal entr{journaled === 1 ? "y" : "ies"}
            {activities.length > 0 ? `, ${activities.length} Strava runs` : ""}
            {nights > 0 ? ` and ${nights} nights of Oura sleep` : ""}
          </p>
        </div>
        {asked && (
          <p className="self-end rounded-2xl rounded-br-sm bg-black px-3 py-2 text-sm text-white">
            {asked}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="whitespace-pre-wrap text-[15px] leading-[1.65] text-black/85">
          {showFallback ? fallback : streamed}
          {pending && <span className="animate-pulse opacity-50"> ▍</span>}
        </p>
      </div>
      {apiKey && (
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={pending}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-black/80 transition hover:border-black/40 disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(question);
        }}
        className="flex h-[51px] shrink-0 items-center gap-2 rounded-[12px] border border-neutral-200 bg-white px-3 shadow-sm"
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
