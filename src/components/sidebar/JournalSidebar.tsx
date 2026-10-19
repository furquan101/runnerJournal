import { useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from "date-fns";
import { Search } from "lucide-react";
import { useEntries } from "@/store/useEntries";
import { useStrava } from "@/store/useStrava";
import { useOura } from "@/store/useOura";
import { useUiMode } from "@/store/useUiMode";
import { todayISO } from "@/lib/date";
import { activityDateISO, describeActivity, metersToMiles } from "@/lib/runStats";
import type { StravaActivity } from "@/types";

const HEATMAP_WIDTH = 351;

export function JournalSidebar() {
  const entriesMap = useEntries((s) => s.entries);
  const activities = useStrava((s) => s.activities);
  const ouraDays = useOura((s) => s.days);
  const selectedDateISO = useUiMode((s) => s.selectedDateISO);
  const setSelectedDate = useUiMode((s) => s.setSelectedDate);
  const [query, setQuery] = useState("");

  const today = todayISO();
  const activeDateISO = selectedDateISO ?? today;

  const entries = useMemo(
    () =>
      Object.values(entriesMap)
        .filter((e) => e.body.trim())
        .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)),
    [entriesMap],
  );
  const runsByDate = useMemo(() => {
    const m = new Map<string, StravaActivity>();
    for (const a of activities) m.set(activityDateISO(a), a);
    return m;
  }, [activities]);

  const firstISO = useMemo(() => {
    const dates = [...entries.map((e) => e.dateISO), ...runsByDate.keys()].sort();
    return dates[0] ?? today;
  }, [entries, runsByDate, today]);
  const trainingDays = differenceInCalendarDays(parseISO(today), parseISO(firstISO)) + 1;
  const totalMiles = useMemo(
    () => activities.filter((a) => activityDateISO(a) >= firstISO).reduce((s, a) => s + metersToMiles(a.distanceMeters), 0),
    [activities, firstISO],
  );

  const q = query.trim().toLowerCase();
  const shown = q ? entries.filter((e) => e.body.toLowerCase().includes(q)) : entries;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-normal text-black">
          {entries.length.toLocaleString()} journal entr{entries.length === 1 ? "y" : "ies"}
        </h2>
        <p className="text-xs opacity-60">
          {trainingDays} days of training · {Math.round(totalMiles).toLocaleString()} miles on Strava
          {Object.keys(ouraDays).length > 0 ? ` · ${Object.keys(ouraDays).length} nights on Oura` : ""}
        </p>
      </div>

      <Heatmap
        firstISO={firstISO}
        todayISO={today}
        hasEntry={(d) => !!entriesMap[d]?.body.trim()}
        hasRun={(d) => runsByDate.has(d)}
        activeISO={activeDateISO}
        onPick={(d) => setSelectedDate(d === today ? null : d)}
      />

      <label className="flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm">
        <Search className="size-4 opacity-40" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your journal…"
          className="flex-1 bg-transparent outline-none placeholder:opacity-50"
        />
        {q && <span className="text-xs opacity-50">{shown.length}</span>}
      </label>

      <div className="flex flex-col">
        {shown.map((e) => {
          const run = runsByDate.get(e.dateISO);
          const sleep = ouraDays[e.dateISO]?.sleepScore;
          const selected = e.dateISO === activeDateISO;
          return (
            <button
              key={e.dateISO}
              type="button"
              data-date={e.dateISO}
              onClick={() => setSelectedDate(e.dateISO === today ? null : e.dateISO)}
              className={
                "flex flex-col gap-1 rounded-md border-b border-[#e5e5e5] px-2 py-3 text-left transition-colors hover:bg-neutral-100 " +
                (selected ? "bg-neutral-100" : "")
              }
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-black">{format(parseISO(e.dateISO), "EEE d MMM")}</span>
                <span className="flex gap-2 text-[11px] opacity-60">
                  {run && <span className="text-[#FC4C02]">{describeActivity(run).split(" · ").slice(0, 2).join(" · ")}</span>}
                  {sleep && <span className="text-[#2f3a8f]">Sleep {sleep}</span>}
                </span>
              </span>
              <span className="line-clamp-2 text-[13px] leading-snug text-black/70">
                <Highlight text={e.body} query={q} />
              </span>
            </button>
          );
        })}
        {shown.length === 0 && <p className="py-4 text-sm opacity-60">No entries match “{query}”.</p>}
      </div>
    </div>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const i = text.toLowerCase().indexOf(query);
  if (i < 0) return <>{text}</>;
  // Start the snippet near the match so it's visible in two lines.
  const start = Math.max(0, i - 40);
  return (
    <>
      {start > 0 ? "…" : ""}
      {text.slice(start, i)}
      <mark className="rounded bg-amber-200/70 px-0.5 text-black">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

function Heatmap({
  firstISO,
  todayISO,
  hasEntry,
  hasRun,
  activeISO,
  onPick,
}: {
  firstISO: string;
  todayISO: string;
  hasEntry: (d: string) => boolean;
  hasRun: (d: string) => boolean;
  activeISO: string;
  onPick: (d: string) => void;
}) {
  const start = startOfWeek(parseISO(firstISO), { weekStartsOn: 1 });
  const weeks = Math.ceil((differenceInCalendarDays(parseISO(todayISO), start) + 1) / 7);
  const gap = 2;
  const cell = Math.max(3, Math.min(11, Math.floor((HEATMAP_WIDTH - (weeks - 1) * gap) / weeks)));

  const cols = [];
  for (let w = 0; w < weeks; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const iso = format(addDays(start, w * 7 + d), "yyyy-MM-dd");
      const future = iso > todayISO;
      const before = iso < firstISO;
      const entry = hasEntry(iso);
      const run = hasRun(iso);
      const color = future || before ? "transparent" : entry && run ? "#1f1f1f" : entry ? "#8a8a8a" : run ? "#fdba95" : "#ececec";
      days.push(
        <button
          key={iso}
          type="button"
          title={iso}
          disabled={future || before || !entry}
          onClick={() => onPick(iso)}
          style={{ width: cell, height: cell, background: color, outline: iso === activeISO ? "1.5px solid #FC4C02" : undefined }}
          className="rounded-[2px] disabled:cursor-default"
        />,
      );
    }
    cols.push(
      <div key={w} className="flex flex-col" style={{ gap }}>
        {days}
      </div>,
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex" style={{ gap }}>
        {cols}
      </div>
      <div className="flex items-center gap-3 text-[11px] opacity-60">
        <Legend color="#1f1f1f" label="Ran + wrote" />
        <Legend color="#8a8a8a" label="Wrote" />
        <Legend color="#fdba95" label="Ran" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="inline-block size-2 rounded-[2px]" style={{ background: color }} />
      {label}
    </span>
  );
}
