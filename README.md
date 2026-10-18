# Runner Journal

A quiet place to write about your training, with an AI coach that reads your journal alongside your real Strava runs.

Marathon and half marathon training has good weeks and bad ones. Runner Journal gives each day a blank page, shows you what was planned next to what you actually ran, and lets a coach reflect it back: what's working, what isn't, and whether your goal time is realistic right now.

## What it does

- **Journal every day.** One page per day with a gentle prompt. Tag each run as *good*, *okay* or *tough*.
- **Planned vs. actual.** Each entry shows the planned workout and the Strava run you logged that day. Workouts tick themselves off when a matching run appears.
- **A plan built from your history.** Pick a race, goal time and training days. With Strava connected, the plan is calibrated to your recent mileage and paces, and the coach tells you honestly if the goal is a stretch.
- **Coach insights.** The coach reads the last two weeks of journal entries, how runs felt and your Strava data, then answers questions like "Is my goal time realistic?" or "What should my next run be?"

Everything is stored in your browser (IndexedDB + localStorage). Your API key and Strava tokens never leave your machine except to call OpenRouter and Strava directly.

## Run it locally

```bash
npm install
npm run dev
```

Then open the app and create a plan.

### Connect Strava

1. Create an API app at [strava.com/settings/api](https://www.strava.com/settings/api).
2. Set **Authorization Callback Domain** to `localhost` (or your deployed domain).
3. In the app, open **Coach insights → Connections**, paste the Client ID and Client Secret, and press **Connect Strava**.

### Turn on the AI coach

Add an [OpenRouter](https://openrouter.ai/keys) API key in **Connections**. The coach and the plan generator use `anthropic/claude-sonnet-5.5` (see `COACH_MODEL` in `src/lib/openrouter.ts`).

Without a key you still get a simple local summary of your streaks, how runs felt and your Strava mileage.

## Stack

React 19, Vite, TypeScript, Tailwind, Radix UI, Zustand, date-fns, idb-keyval.
