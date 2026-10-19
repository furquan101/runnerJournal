import { addDays, format } from "date-fns";
import { useSettings } from "@/store/useSettings";
import type { OuraDay } from "@/types";

// Oura API v2, client-side OAuth flow: the token comes back in the URL fragment, so no client
// secret lives in the browser. https://cloud.ouraring.com/docs/authentication
const AUTH_URL = "https://cloud.ouraring.com/oauth/authorize";
const API_BASE = "https://api.ouraring.com/v2/usercollection";
const SCOPE = "daily heartrate personal";
const STATE_KEY = "rj.oura.oauthState";

export class OuraNotConnectedError extends Error {
  constructor() {
    super("Oura is not connected");
    this.name = "OuraNotConnectedError";
  }
}

function redirectUri(): string {
  return window.location.origin + window.location.pathname;
}

export function startOuraOAuth(clientId: string): void {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const state = "oura-" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem(STATE_KEY, state);
  const params = new URLSearchParams({
    response_type: "token",
    client_id: clientId,
    redirect_uri: redirectUri(),
    scope: SCOPE,
    state,
  });
  window.location.href = `${AUTH_URL}?${params.toString()}`;
}

export function isOuraCallback(): boolean {
  return window.location.hash.includes("access_token=") && window.location.hash.includes("state=oura-");
}

export function handleOuraCallback(): { ok: true } | { ok: false; reason: string } {
  const params = new URLSearchParams(window.location.hash.slice(1));
  window.history.replaceState({}, "", window.location.origin + window.location.pathname);
  const stored = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  if (!stored || stored !== params.get("state")) return { ok: false, reason: "Oura state mismatch — try again." };
  const token = params.get("access_token");
  if (!token) return { ok: false, reason: params.get("error") ?? "Oura didn't return a token." };
  const expiresIn = Number(params.get("expires_in") ?? 2592000);
  useSettings.getState().setOuraToken({
    accessToken: token,
    expiresAt: Math.floor(Date.now() / 1000) + expiresIn,
  });
  return { ok: true };
}

type Collection<T> = { data: T[]; next_token?: string | null };

async function getAll<T>(path: string, token: string, start: string, end: string): Promise<T[]> {
  const out: T[] = [];
  let next: string | null | undefined;
  do {
    const params = new URLSearchParams({ start_date: start, end_date: end });
    if (next) params.set("next_token", next);
    const res = await fetch(`${API_BASE}/${path}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Oura ${path} failed (${res.status}): ${text || res.statusText}`);
    }
    const json: Collection<T> = await res.json();
    out.push(...json.data);
    next = json.next_token;
  } while (next);
  return out;
}

type DailySleep = { day: string; score?: number };
type DailyReadiness = { day: string; score?: number };
type SleepPeriod = {
  day: string;
  type?: string;
  total_sleep_duration?: number;
  average_hrv?: number;
  lowest_heart_rate?: number;
};

/** Fetch a year of nights and merge the three Oura collections into one record per day. */
export async function fetchOuraDays(days = 365): Promise<OuraDay[]> {
  const { ouraAccessToken: token, ouraExpiresAt } = useSettings.getState();
  if (!token || (ouraExpiresAt && ouraExpiresAt < Date.now() / 1000)) throw new OuraNotConnectedError();
  const end = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const start = format(addDays(new Date(), -days), "yyyy-MM-dd");
  const [sleep, readiness, periods] = await Promise.all([
    getAll<DailySleep>("daily_sleep", token, start, end),
    getAll<DailyReadiness>("daily_readiness", token, start, end),
    getAll<SleepPeriod>("sleep", token, start, end),
  ]);

  const byDay = new Map<string, OuraDay>();
  const day = (d: string) => byDay.get(d) ?? byDay.set(d, { dateISO: d }).get(d)!;
  for (const s of sleep) day(s.day).sleepScore = s.score;
  for (const r of readiness) day(r.day).readinessScore = r.score;
  for (const p of periods) {
    if (p.type && p.type !== "long_sleep") continue;
    const d = day(p.day);
    if (p.total_sleep_duration) d.sleepHours = Math.round((p.total_sleep_duration / 3600) * 10) / 10;
    if (p.average_hrv) d.hrvMs = Math.round(p.average_hrv);
    if (p.lowest_heart_rate) d.restingHr = p.lowest_heart_rate;
  }
  return [...byDay.values()].sort((a, b) => (a.dateISO < b.dateISO ? -1 : 1));
}

export function fmtSleep(hours: number): string {
  const h = Math.floor(hours);
  return `${h}h ${String(Math.round((hours - h) * 60)).padStart(2, "0")}m`;
}

/** "Sleep 82 · 7h 40m · HRV 48 ms · Readiness 79" */
export function describeOuraDay(d: OuraDay): string {
  const parts: string[] = [];
  if (d.sleepScore) parts.push(`Sleep ${d.sleepScore}`);
  if (d.sleepHours) parts.push(fmtSleep(d.sleepHours));
  if (d.hrvMs) parts.push(`HRV ${d.hrvMs} ms`);
  if (d.readinessScore) parts.push(`Readiness ${d.readinessScore}`);
  return parts.join(" · ");
}
