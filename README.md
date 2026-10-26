# Runner Journal

A quiet place to write about your marathon training, with an AI coach that reads your journal alongside your Strava runs and Oura recovery.

Training for a marathon is months of getting out in the rain, the cold and the heat, runs where your legs feel like cement, and setbacks with injuries and busy weeks. Most of that journey gets forgotten once race day comes. Runner Journal gives every day a blank page, so you can look back on the good days and the bad ones, and get coaching that's grounded in what actually happened.

**Try the demo:** [furquan101.github.io/runnerJournal](https://furquan101.github.io/runnerJournal/) uses a sample runner's data and pre-written coach replies, so you can click around without connecting anything.

## What it does

- **A page for every day.** Write how the run really went. Flick back and forth between days, and finished workouts are ticked off from Strava.
- **Your whole journal in one place.** See how many entries you've written, a heatmap of every training day, and search across everything ("knee", "rain", "PB").
- **A plan built from your history.** Pick a race, goal time and training days. With Strava connected, the plan is calibrated to your recent mileage and paces, and it tells you honestly if the goal is a stretch.
- **A weekly check-in from your coach.** The coach reads your whole journal, your Strava runs and your Oura sleep, HRV and readiness, then tells you how training is going, what you're doing well and what to look out for in your next session. You can also ask it questions like "Is my goal time realistic?"

## Run it locally

```bash
npm install
npm run dev
```

Then open the app and create a plan.

### Connect Strava

1. Create an API app at [strava.com/settings/api](https://www.strava.com/settings/api).
2. Set **Authorization Callback Domain** to `localhost` (or your own domain).
3. In the app, open **Coach → Connections**, paste the Client ID and Client Secret, and press **Connect Strava**.

### Connect Oura

1. Create an app at [cloud.ouraring.com/oauth/applications](https://cloud.ouraring.com/oauth/applications) and add your app's URL as a redirect URI.
2. In **Connections**, paste the Client ID and press **Connect Oura**. Runner Journal uses Oura's client-side sign-in, so no client secret is needed.

### Turn on the AI coach

Add an [OpenRouter](https://openrouter.ai/keys) API key in **Connections**. The coach and the plan generator use `anthropic/claude-sonnet-5.5` (see `COACH_MODEL` in `src/lib/openrouter.ts`).

Without a key you still get a simple local summary of your streak and Strava mileage.

### Demo mode

`VITE_DEMO=true npm run build` builds the demo: a year of sample runs, Oura nights and journal entries are seeded into the browser, and Strava, Oura and OpenRouter requests are answered locally (see `src/demo/`). Add `?onboarding` to the URL on first load to start from plan creation.

## Privacy and security

- There's no server. Your journal, plan and synced data live in your browser (IndexedDB and localStorage).
- Your OpenRouter key, Strava credentials and Oura token are also stored in your browser and only ever sent to OpenRouter, Strava and Oura. Production builds include a Content Security Policy that blocks requests to any other host.
- Because keys live in the browser, use a personal OpenRouter key with a spending limit, and don't run the app on a shared computer.
- Found a security issue? See [SECURITY.md](SECURITY.md).

## Stack

React 19, Vite, TypeScript, Tailwind, Radix UI, Zustand, date-fns, idb-keyval.

## Licence

Code is licensed under the [Apache License 2.0](LICENSE).

The Coach Bennett avatar (`public/coach-bennet.jpg`) is artwork from Coach Bennett's Podcast. It is not covered by this licence and belongs to its owner.
