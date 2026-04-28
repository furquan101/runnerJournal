import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FontFamily } from "@/types";

type SettingsState = {
  fontFamily: FontFamily;
  fontSize: 16 | 18 | 20 | 22;
  openRouterKey: string | null;

  stravaClientId: string | null;
  stravaClientSecret: string | null;
  stravaAccessToken: string | null;
  stravaRefreshToken: string | null;
  stravaExpiresAt: number | null;
  stravaAthleteId: number | null;

  ouraConnected: boolean;

  setFontFamily: (f: FontFamily) => void;
  setFontSize: (s: 16 | 18 | 20 | 22) => void;
  setOpenRouterKey: (k: string | null) => void;
  setStravaCredentials: (creds: { clientId: string | null; clientSecret: string | null }) => void;
  setStravaTokens: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    athleteId: number;
  }) => void;
  clearStrava: () => void;
  setOuraConnected: (b: boolean) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      fontFamily: "Rubik",
      fontSize: 20,
      openRouterKey: null,

      stravaClientId: null,
      stravaClientSecret: null,
      stravaAccessToken: null,
      stravaRefreshToken: null,
      stravaExpiresAt: null,
      stravaAthleteId: null,

      ouraConnected: false,

      setFontFamily: (fontFamily) => set({ fontFamily }),
      setFontSize: (fontSize) => set({ fontSize }),
      setOpenRouterKey: (openRouterKey) => set({ openRouterKey }),
      setStravaCredentials: ({ clientId, clientSecret }) =>
        set({ stravaClientId: clientId, stravaClientSecret: clientSecret }),
      setStravaTokens: ({ accessToken, refreshToken, expiresAt, athleteId }) =>
        set({
          stravaAccessToken: accessToken,
          stravaRefreshToken: refreshToken,
          stravaExpiresAt: expiresAt,
          stravaAthleteId: athleteId,
        }),
      clearStrava: () =>
        set({
          stravaClientId: null,
          stravaClientSecret: null,
          stravaAccessToken: null,
          stravaRefreshToken: null,
          stravaExpiresAt: null,
          stravaAthleteId: null,
        }),
      setOuraConnected: (ouraConnected) => set({ ouraConnected }),
    }),
    { name: "rj.settings" },
  ),
);

export const FONT_STACKS: Record<FontFamily, string> = {
  Rubik: "'Rubik', system-ui, sans-serif",
  Lato: "'Lato', system-ui, sans-serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  "System Sans": "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};
