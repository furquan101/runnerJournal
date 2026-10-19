import type { RunDetail, StravaActivity } from "@/types";

export const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
export const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
export const STRAVA_API_BASE = "https://www.strava.com/api/v3";

const SCOPE = "read,activity:read_all";

export class StravaNotConnectedError extends Error {
  constructor() {
    super("Strava is not connected");
    this.name = "StravaNotConnectedError";
  }
}

export class StravaApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "StravaApiError";
  }
}

export type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number };
};

export function buildAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: SCOPE,
    state,
  });
  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<StravaTokenResponse> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new StravaApiError(res.status, `Token exchange failed: ${text || res.statusText}`);
  }
  return res.json();
}

export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<StravaTokenResponse> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new StravaApiError(res.status, `Token refresh failed: ${text || res.statusText}`);
  }
  return res.json();
}

type RawActivity = {
  id: number;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  name: string;
  type: string;
  sport_type?: string;
  average_heartrate?: number;
  average_speed?: number;
  total_elevation_gain?: number;
  map?: { summary_polyline?: string | null; polyline?: string | null };
};

function isRun(a: RawActivity): boolean {
  const t = (a.sport_type ?? a.type ?? "").toLowerCase();
  return t === "run" || t === "trailrun" || t === "virtualrun";
}

/** Pages through the athlete's activities (newest first) back to `after`, up to `maxPages`. */
export async function fetchActivities(opts: {
  accessToken: string;
  perPage?: number;
  after?: number;
  maxPages?: number;
}): Promise<StravaActivity[]> {
  const perPage = opts.perPage ?? 100;
  const raw: RawActivity[] = [];
  for (let page = 1; page <= (opts.maxPages ?? 8); page++) {
    const params = new URLSearchParams({ per_page: String(perPage), page: String(page) });
    if (opts.after) params.set("after", String(opts.after));
    const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?${params.toString()}`, {
      headers: { Authorization: `Bearer ${opts.accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new StravaApiError(res.status, `Activity fetch failed: ${text || res.statusText}`);
    }
    const batch: RawActivity[] = await res.json();
    raw.push(...batch);
    if (batch.length < perPage) break;
  }
  return raw.filter(isRun).map((a) => ({
    id: a.id,
    startDateISO: a.start_date,
    distanceMeters: a.distance,
    movingTimeSec: a.moving_time,
    elapsedTimeSec: a.elapsed_time,
    name: a.name,
    type: a.sport_type ?? a.type,
    averageHeartrate: a.average_heartrate,
    averageSpeed: a.average_speed,
    totalElevationGainM: a.total_elevation_gain,
    summaryPolyline: a.map?.summary_polyline ?? undefined,
  }));
}

type RawDetail = RawActivity & {
  splits_standard?: {
    split: number;
    distance: number;
    moving_time: number;
    average_heartrate?: number;
    elevation_difference?: number;
  }[];
};

/** Full route and per-mile splits for one activity. */
export async function fetchActivityDetail(accessToken: string, id: number): Promise<RunDetail> {
  const res = await fetch(`${STRAVA_API_BASE}/activities/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new StravaApiError(res.status, `Activity detail failed: ${text || res.statusText}`);
  }
  const a: RawDetail = await res.json();
  return {
    id: a.id,
    polyline: a.map?.polyline || a.map?.summary_polyline || "",
    splits: (a.splits_standard ?? []).map((s) => ({
      mile: s.split,
      distanceM: s.distance,
      movingSec: s.moving_time,
      averageHeartrate: s.average_heartrate,
      elevationDiffM: s.elevation_difference,
    })),
  };
}
