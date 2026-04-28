import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUiMode } from "@/store/useUiMode";
import { usePlan } from "@/store/usePlan";
import { useSettings } from "@/store/useSettings";
import { useStrava } from "@/store/useStrava";
import { buildSchedule } from "@/lib/planGenerator";
import { generateLLMPlan, LLMPlanError } from "@/lib/planLLM";
import { groupByWeek, weekMiles } from "@/lib/planWeeks";
import type { RaceTarget, Workout } from "@/types";
import { searchRaces, type KnownRace } from "@/data/races";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Preview = { target: RaceTarget; schedule: Workout[]; notes?: string };

export function PlanCreatorDialog() {
  const { planDialogOpen, closePlanDialog } = useUiMode();
  const { plan, setPlan } = usePlan();
  const onboarding = plan === null;
  const open = planDialogOpen || onboarding;

  const [race, setRace] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [goalTime, setGoalTime] = useState("");
  const [trainingFreqPerWeek, setFreq] = useState("4");
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const justPickedRef = useRef(false);

  const apiKey = useSettings((s) => s.openRouterKey);
  const stravaConnected = useSettings((s) => !!s.stravaAccessToken);
  const activities = useStrava((s) => s.activities);
  const syncStrava = useStrava((s) => s.sync);

  const [generating, setGenerating] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<RaceTarget | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const canPersonalise = !!apiKey && stravaConnected;

  const suggestions = useMemo(() => searchRaces(race), [race]);

  useEffect(() => {
    if (open && plan) {
      setRace(plan.target.race);
      setRaceDate(plan.target.raceDate);
      setGoalTime(plan.target.goalTime);
      setFreq(String(plan.target.trainingFreqPerWeek));
      setPreferredDays(plan.target.preferredDays);
    }
  }, [open, plan]);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      setPendingTarget(null);
    }
  }, [open]);

  useEffect(() => {
    setActiveSuggestion(0);
  }, [race]);

  const togglePreferred = (d: string) =>
    setPreferredDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  const pickRace = (r: KnownRace) => {
    justPickedRef.current = true;
    setRace(r.name);
    setRaceDate(r.date);
    if (r.suggestedFreq) setFreq(String(r.suggestedFreq));
    if (r.suggestedDays) setPreferredDays(r.suggestedDays);
    setShowSuggestions(false);
    window.setTimeout(() => {
      justPickedRef.current = false;
    }, 0);
  };

  const previewBaseline = (target: RaceTarget) => {
    setPreview({ target, schedule: buildSchedule(target) });
    setError(null);
    setPendingTarget(null);
  };

  const previewLLMPlan = async (target: RaceTarget) => {
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    setGenerating(true);
    setError(null);
    try {
      let acts = activities;
      if (acts.length === 0) {
        await syncStrava();
        acts = useStrava.getState().activities;
      }
      const { schedule, notes } = await generateLLMPlan({
        apiKey: apiKey!,
        target,
        activities: acts,
        signal: ctl.signal,
      });
      setPreview({ target, schedule, notes });
      setPendingTarget(null);
    } catch (e) {
      if (ctl.signal.aborted) return;
      const msg = e instanceof LLMPlanError ? e.message : e instanceof Error ? e.message : String(e);
      setError(msg);
      setPendingTarget(target);
    } finally {
      if (abortRef.current === ctl) {
        setGenerating(false);
        abortRef.current = null;
      }
    }
  };

  const submit = () => {
    if (!race.trim()) return setError("Add a race name");
    if (!raceDate) return setError("Pick a race date");
    if (!goalTime.trim()) return setError("Add a goal time");
    const freq = Number(trainingFreqPerWeek);
    if (!Number.isFinite(freq) || freq < 1 || freq > 7)
      return setError("Training frequency must be 1–7");
    if (preferredDays.length === 0) return setError("Pick at least one preferred day");
    const target: RaceTarget = {
      race: race.trim(),
      raceDate,
      goalTime: goalTime.trim(),
      trainingFreqPerWeek: freq,
      preferredDays,
      createdAt: new Date().toISOString(),
    };
    if (canPersonalise) {
      void previewLLMPlan(target);
    } else {
      previewBaseline(target);
    }
  };

  const savePreview = () => {
    if (!preview) return;
    setPlan(preview.target, preview.schedule, preview.notes);
    setPreview(null);
    setError(null);
    if (!onboarding) closePlanDialog();
  };

  const backToForm = () => setPreview(null);

  const onRaceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickRace(suggestions[activeSuggestion]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !onboarding) closePlanDialog();
      }}
    >
      <DialogContent
        className={preview ? "max-w-[720px]" : "max-w-[640px]"}
        onInteractOutside={(e) => onboarding && e.preventDefault()}
        onEscapeKeyDown={(e) => onboarding && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-3xl font-normal">
            {preview ? "Preview your plan" : "Create a plan"}
          </DialogTitle>
        </DialogHeader>

        {preview ? (
          <PlanPreview
            preview={preview}
            onBack={backToForm}
            onSave={savePreview}
            saveLabel={onboarding ? "Save plan" : "Save changes"}
          />
        ) : (
          <div className="flex flex-col gap-6 pt-2">
            <Field label="What race are you running?">
              <div className="relative">
                <Input
                  value={race}
                  onChange={(e) => {
                    setRace(e.target.value);
                    if (!justPickedRef.current) setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (race.trim().length >= 2) setShowSuggestions(true);
                  }}
                  onBlur={() => {
                    window.setTimeout(() => setShowSuggestions(false), 120);
                  }}
                  onKeyDown={onRaceKeyDown}
                  placeholder="Sydney Marathon"
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-neutral-200 bg-white shadow-md">
                    {suggestions.map((r, i) => {
                      const active = i === activeSuggestion;
                      return (
                        <li key={`${r.name}-${r.date}`}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pickRace(r)}
                            onMouseEnter={() => setActiveSuggestion(i)}
                            className={
                              "flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm transition " +
                              (active ? "bg-neutral-100" : "bg-white")
                            }
                          >
                            <span className="flex flex-col">
                              <span className="text-black">{r.name}</span>
                              <span className="text-xs opacity-60">
                                {r.city} · {labelDistance(r.distance)}
                              </span>
                            </span>
                            <span className="text-xs opacity-70 whitespace-nowrap">
                              {format(parseISO(r.date), "d LLL yyyy")}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Field>
            <Field label="Date of the race?">
              <Input type="date" value={raceDate} onChange={(e) => setRaceDate(e.target.value)} />
            </Field>
            <Field label="Goal time">
              <Input
                value={goalTime}
                onChange={(e) => setGoalTime(e.target.value)}
                placeholder="3:45"
              />
            </Field>
            <Field label="How often are you able to train per week?">
              <Input
                type="number"
                min={1}
                max={7}
                value={trainingFreqPerWeek}
                onChange={(e) => setFreq(e.target.value)}
              />
            </Field>
            <Field label="Preferred days to train?">
              <div className="flex gap-2">
                {WEEKDAYS.map((d) => {
                  const active = preferredDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => togglePreferred(d)}
                      className={
                        "h-9 w-12 rounded-md border text-sm transition " +
                        (active
                          ? "bg-black text-white border-black"
                          : "bg-white text-black border-neutral-300 hover:border-black")
                      }
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </Field>
            {!canPersonalise && (
              <p className="text-xs opacity-60">
                For a Strava-personalised plan, add an OpenRouter key and connect Strava in Connections.
              </p>
            )}
            {error && (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-red-600">{error}</p>
                {pendingTarget && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => pendingTarget && void previewLLMPlan(pendingTarget)}
                      disabled={generating}
                    >
                      Try again
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => pendingTarget && previewBaseline(pendingTarget)}
                      disabled={generating}
                    >
                      Use a baseline plan
                    </Button>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={submit} disabled={generating}>
                {generating ? "Building preview…" : "Preview plan"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PlanPreview({
  preview,
  onBack,
  onSave,
  saveLabel,
}: {
  preview: Preview;
  onBack: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  const weeks = useMemo(() => groupByWeek(preview.schedule), [preview.schedule]);
  const totalMiles = useMemo(
    () => preview.schedule.reduce((s, w) => s + (w.distanceMiles ?? 0), 0),
    [preview.schedule],
  );
  const peakWeekMiles = useMemo(
    () => weeks.reduce((max, wk) => Math.max(max, weekMiles(wk.workouts)), 0),
    [weeks],
  );
  const longestRun = useMemo(
    () => preview.schedule.reduce((max, w) => Math.max(max, w.distanceMiles ?? 0), 0),
    [preview.schedule],
  );

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
        <p className="text-base text-black">
          {preview.target.race} · {format(parseISO(preview.target.raceDate), "d LLL yyyy")}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-70">
          <span>Goal {preview.target.goalTime}</span>
          <span>{weeks.length} weeks</span>
          <span>{totalMiles} mi total</span>
          <span>Peak {peakWeekMiles} mi/wk</span>
          <span>Longest run {longestRun} mi</span>
        </div>
        {preview.notes && (
          <p className="mt-2 text-xs leading-relaxed text-black/70">{preview.notes}</p>
        )}
      </div>

      <div className="max-h-[50vh] overflow-y-auto rounded-md border border-neutral-200">
        {weeks.map((wk, i) => (
          <div
            key={wk.weekStartISO}
            className="border-b border-neutral-200 px-4 py-3 last:border-b-0"
          >
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-black">
                Week {i + 1} · {format(parseISO(wk.weekStartISO), "d LLL")}
              </p>
              <p className="text-xs opacity-60">{weekMiles(wk.workouts)} mi</p>
            </div>
            <ul className="mt-2 flex flex-col gap-1">
              {wk.workouts.map((w) => (
                <li key={w.id} className="flex items-center gap-3 text-xs text-black/80">
                  <span className="w-10 shrink-0 opacity-60">{w.weekday.slice(0, 3)}</span>
                  <span className="flex-1">{w.description}</span>
                  {w.pace && <span className="opacity-60">{w.pace}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSave}>{saveLabel}</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm opacity-70">{label}</Label>
      {children}
    </div>
  );
}

function labelDistance(d: KnownRace["distance"]): string {
  switch (d) {
    case "marathon":
      return "Marathon";
    case "half":
      return "Half marathon";
    case "10mile":
      return "10 mile";
    case "10k":
      return "10K";
    case "ultra":
      return "Ultra";
  }
}
