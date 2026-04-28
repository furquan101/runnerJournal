import { useSettings } from "@/store/useSettings";
import {
  StravaNotConnectedError,
  buildAuthUrl,
  exchangeCodeForToken,
  refreshAccessToken,
} from "@/lib/strava";

const STATE_KEY = "rj.strava.oauthState";

function redirectUri(): string {
  return window.location.origin + window.location.pathname;
}

function randomState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function startStravaOAuth(clientId: string): void {
  const state = randomState();
  sessionStorage.setItem(STATE_KEY, state);
  window.location.href = buildAuthUrl(clientId, redirectUri(), state);
}

export type OAuthCallbackResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function handleStravaOAuthCallback(): Promise<OAuthCallbackResult | null> {
  const search = new URLSearchParams(window.location.search);
  const code = search.get("code");
  const state = search.get("state");
  const error = search.get("error");

  if (!code && !error) return null;

  const cleanUrl = () => {
    const url = window.location.origin + window.location.pathname;
    window.history.replaceState({}, "", url);
  };

  if (error) {
    sessionStorage.removeItem(STATE_KEY);
    cleanUrl();
    return { ok: false, reason: `Strava returned error: ${error}` };
  }

  const storedState = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  if (!storedState || storedState !== state) {
    cleanUrl();
    return { ok: false, reason: "OAuth state mismatch — start over." };
  }

  const { stravaClientId: clientId, stravaClientSecret: clientSecret } = useSettings.getState();
  if (!clientId || !clientSecret) {
    cleanUrl();
    return { ok: false, reason: "Strava credentials missing — re-enter and try again." };
  }

  try {
    const token = await exchangeCodeForToken(clientId, clientSecret, code!);
    if (!token.athlete?.id) {
      cleanUrl();
      return { ok: false, reason: "Strava response missing athlete id." };
    }
    useSettings.getState().setStravaTokens({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: token.expires_at,
      athleteId: token.athlete.id,
    });
    cleanUrl();
    return { ok: true };
  } catch (e) {
    cleanUrl();
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

export async function getValidAccessToken(): Promise<string> {
  const s = useSettings.getState();
  if (!s.stravaClientId || !s.stravaClientSecret || !s.stravaRefreshToken || !s.stravaAccessToken) {
    throw new StravaNotConnectedError();
  }
  const now = Math.floor(Date.now() / 1000);
  if (s.stravaExpiresAt && s.stravaExpiresAt > now + 60) {
    return s.stravaAccessToken;
  }
  const refreshed = await refreshAccessToken(
    s.stravaClientId,
    s.stravaClientSecret,
    s.stravaRefreshToken,
  );
  s.setStravaTokens({
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresAt: refreshed.expires_at,
    athleteId: refreshed.athlete?.id ?? s.stravaAthleteId ?? 0,
  });
  return refreshed.access_token;
}
