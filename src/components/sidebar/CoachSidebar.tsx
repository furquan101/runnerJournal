import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUp } from "lucide-react";
import { useEntries } from "@/store/useEntries";
import { usePlan } from "@/store/usePlan";
import { useSettings } from "@/store/useSettings";
import { useUiMode } from "@/store/useUiMode";
import { MissingApiKeyError, streamCoachInsights } from "@/lib/openrouter";



export function CoachSidebar() {
  const entriesMap = useEntries((s) => s.entries);
  const plan = usePlan((s) => s.plan);
  const apiKey = useSettings((s) => s.openRouterKey);
  const toggleSidebar = useUiMode((s) => s.toggleSidebar);
  const openConnections = useUiMode((s) => s.openConnectionsDialog);

  const recentEntries = useMemo(
    () => Object.values(entriesMap).sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1)),
    [entriesMap],
  );

  const [streamed, setStreamed] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [question, setQuestion] = useState("");
  const abortRef = useRef<AbortController | null>(null);

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
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Back to workouts"
          className="chrome -ml-1 flex h-8 w-8 items-center justify-center rounded-full text-black/70 hover:text-black"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-3xl font-normal text-black">Coach insights:</h2>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!showFallback && (
          <p className="whitespace-pre-wrap text-sm leading-[1.6] text-black/80">
            {streamed}
            {pending && <span className="opacity-50">…</span>}
          </p>
        )}
        {showFallback && <ConnectEmptyState onConnect={openConnections} />}
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

function ConnectEmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-5">
      <svg
        viewBox="0 0 280 200"
        className="w-full max-w-[280px]"
        aria-hidden="true"
      >
        <path
          d="M30 100 Q26 30 130 22 Q232 18 258 90 Q280 162 168 176 Q54 188 30 100 Z"
          fill="#F8EBD8"
        />
        <circle cx="50" cy="44" r="10" fill="#FFD66B" />
        <circle cx="36" cy="130" r="3" fill="#1877F2" opacity="0.4" />
        <circle cx="244" cy="148" r="3" fill="#1877F2" opacity="0.35" />
        <circle cx="222" cy="32" r="2" fill="#F4876B" opacity="0.7" />

        <g className="motion-safe:animate-runner-bob">
          <path
            d="M118 30 Q118 18 130 18 L222 18 Q234 18 234 30 L234 64 Q234 76 222 76 L172 76 L158 90 L164 76 L130 76 Q118 76 118 64 Z"
            fill="#FFFFFF"
            stroke="#1877F2"
            strokeWidth="2"
          />
        </g>
        <g fill="#1877F2">
          <circle
            cx="148"
            cy="47"
            r="4"
            className="motion-safe:animate-dot-blink"
          />
          <circle
            cx="172"
            cy="47"
            r="4"
            className="motion-safe:animate-dot-blink"
            style={{ animationDelay: "0.2s" }}
          />
          <circle
            cx="196"
            cy="47"
            r="4"
            className="motion-safe:animate-dot-blink"
            style={{ animationDelay: "0.4s" }}
          />
        </g>

        <ellipse cx="142" cy="172" rx="84" ry="3" fill="#000" opacity="0.07" />

        <g transform="translate(58 124)">
          <rect x="0" y="32" width="92" height="10" rx="5" fill="#FFFFFF" stroke="#1F2A37" strokeWidth="1.2" />
          <path d="M8 32 Q8 12 30 10 Q48 8 62 14 L82 18 Q90 22 90 32 Z" fill="#1877F2" />
          <path d="M8 32 Q8 18 22 14 L26 32 Z" fill="#FFFFFF" />
          <path d="M24 22 Q46 12 78 22" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <circle cx="36" cy="18" r="1.6" fill="#FFFFFF" />
          <circle cx="48" cy="15" r="1.6" fill="#FFFFFF" />
          <circle cx="60" cy="15" r="1.6" fill="#FFFFFF" />
        </g>

        <g transform="translate(132 138) rotate(-6)">
          <rect x="0" y="32" width="92" height="10" rx="5" fill="#FFFFFF" stroke="#1F2A37" strokeWidth="1.2" />
          <path d="M8 32 Q8 12 30 10 Q48 8 62 14 L82 18 Q90 22 90 32 Z" fill="#F4876B" />
          <path d="M8 32 Q8 18 22 14 L26 32 Z" fill="#FFFFFF" />
          <path d="M24 22 Q46 12 78 22" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <circle cx="36" cy="18" r="1.6" fill="#FFFFFF" />
          <circle cx="48" cy="15" r="1.6" fill="#FFFFFF" />
          <circle cx="60" cy="15" r="1.6" fill="#FFFFFF" />
        </g>
      </svg>
      <div className="flex flex-col items-center gap-1 px-6 text-center">
        <p className="text-base text-black">Your coach is warming up.</p>
        <p className="text-sm text-black/60">Connect OpenRouter to start chatting.</p>
      </div>
      <button
        type="button"
        onClick={onConnect}
        className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/80"
      >
        Connect OpenRouter
      </button>
    </div>
  );
}
