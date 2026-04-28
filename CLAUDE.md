# Runner Journal

A running journal app that produces personalised AI training plans for a target race
(e.g. Sydney Marathon). Runners see their week-by-week schedule, tick workouts off as they
complete them, journal about each run, and chat with an AI coach that has full context on
their plan, recent journal entries, and Strava activity.

## What it does

- **Plan creation** — user picks a goal race, target time, and how many days a week they
  can run. The app generates a multi-week schedule of easy / long / tempo / interval runs
  building toward race day.
- **Workout sidebar** — each day's workout is shown with a checkbox; ticking marks it done.
- **Journal** — Tiptap rich-text editor (`components/journal/`) where the runner reflects
  on a run. One entry per date.
- **Coach insights** — sidebar mode that streams personalised feedback from an LLM via
  OpenRouter, using the runner's plan + recent journal entries + Strava data as context.
- **Strava sync** — pulls recent activities to verify completion and inform coaching.
- **Plan overview dialog** — week-by-week breakdown with per-workout effort guidance and
  marathon-relevance context (`lib/workoutDetails.ts`).

## Tech stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS** with a minimal black-on-cream aesthetic
- **shadcn/ui** for the design system — primitives live in `src/components/ui/`, configured
  via `components.json`. Use shadcn components by default; only hand-roll when nothing in
  the system fits.
- **Radix UI** primitives (Dialog, DropdownMenu, Switch, etc.) underneath shadcn
- **Zustand** for client state (`src/store/`)
- **idb-keyval** for persistence (plan, entries, settings, Strava tokens)
- **Tiptap** for rich-text journaling
- **OpenRouter** for LLM calls (coach + plan generation), `lib/openrouter.ts`
- **date-fns** for all date handling

## Architecture

```
src/
  App.tsx              top-level shell — journal editor + sidebars + dialogs
  store/               zustand stores (one per domain)
    usePlan            plan + workout completion
    useEntries         journal entries
    useSettings        OpenRouter key, font, etc.
    useStrava          Strava OAuth + activities cache
    useUiMode          sidebar mode, dialog open state, selected date
  lib/
    planGenerator.ts   deterministic schedule from race target + days/week
    planLLM.ts         optional LLM-generated plan via OpenRouter
    planWeeks.ts       group schedule into weeks for the overview dialog
    workoutDetails.ts  effort / marathon-relevance copy per workout type
    openrouter.ts      streaming coach insights
    strava.ts          activities fetch + token refresh
  components/
    sidebar/           WorkoutSidebar, CoachSidebar, SidebarShell
    journal/           Tiptap editor
    statusbar/         bottom-status links (font picker, days-until, etc.)
    dialogs/           PlanCreator, PlanOverview, Connections
    ui/                shadcn primitives (Button, Dialog, Input, …)
```

## Conventions

- **Design system** — use `@/components/ui/*` (shadcn) for buttons, dialogs, inputs.
  When something custom is needed, match the existing flat black-on-light aesthetic.
- **Colour palette** — black (`text-black`, `bg-black`), neutral greys (`text-black/60`,
  `border-neutral-200`), cream backgrounds (`#fafafa`, `#F8EBD8`). Facebook-blue
  (`#1877F2`) and coral (`#F4876B`) appear as accent colours in illustrations.
- **Icons** — `lucide-react` is the icon library. Don't introduce another set.
- **State** — reach for Zustand stores, not prop drilling. Persistence is handled inside
  the store via `idb-keyval`.
- **Dates** — always use `date-fns`, ISO strings (`yyyy-MM-dd`) as the date primitive,
  `lib/date.ts:todayISO()` for "today".
- **Don't add comments** that just describe what the code does. The codebase is small
  enough that names speak for themselves.

## Running it

```
npm run dev      # vite dev server
npm run build    # tsc -b && vite build
npm run lint     # eslint
```
