import { useEffect, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUiMode } from "@/store/useUiMode";
import { useSettings } from "@/store/useSettings";
import { useStrava } from "@/store/useStrava";
import { startStravaOAuth } from "@/lib/stravaOAuth";
import { startOuraOAuth } from "@/lib/oura";
import { useOura } from "@/store/useOura";
import { isDemo } from "@/demo/demo";

export function ConnectionsDialog() {
  const open = useUiMode((s) => s.connectionsDialogOpen);
  const close = useUiMode((s) => s.closeConnectionsDialog);
  const apiKey = useSettings((s) => s.openRouterKey);
  const setApiKey = useSettings((s) => s.setOpenRouterKey);

  const [draftKey, setDraftKey] = useState(apiKey ?? "");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setDraftKey(apiKey ?? "");
  }, [open, apiKey]);

  const onSave = () => {
    setApiKey(draftKey.trim() || null);
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-normal">Connections</DialogTitle>
          <DialogDescription className="opacity-70">
            Connect Strava and your Oura ring so your coach can see your real runs and sleep, and add an OpenRouter key so it can talk back.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-2">
          {isDemo && (
            <p className="rounded-md bg-neutral-100 px-3 py-2 text-xs leading-relaxed text-black/70">
              This is a demo with a sample runner's Strava history and pre-written coach replies.
              Run it yourself with your own Strava and OpenRouter key to get real insights.
            </p>
          )}
          {!isDemo && <div className="flex flex-col gap-2">
            <Label className="text-sm">OpenRouter API key</Label>
            <Input
              type="password"
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="sk-or-..."
              autoComplete="off"
            />
            <p className="text-xs opacity-60">
              Stored in your browser only. Used to call Claude on your behalf.
            </p>
          </div>}

          <StravaSection />

          <OuraSection />

          <div className="flex justify-end pt-2">
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StravaSection() {
  const clientId = useSettings((s) => s.stravaClientId);
  const clientSecret = useSettings((s) => s.stravaClientSecret);
  const accessToken = useSettings((s) => s.stravaAccessToken);
  const athleteId = useSettings((s) => s.stravaAthleteId);
  const setStravaCredentials = useSettings((s) => s.setStravaCredentials);
  const clearStrava = useSettings((s) => s.clearStrava);

  const activities = useStrava((s) => s.activities);
  const lastSyncedAt = useStrava((s) => s.lastSyncedAt);
  const syncing = useStrava((s) => s.syncing);
  const stravaError = useStrava((s) => s.error);
  const sync = useStrava((s) => s.sync);
  const clearActivities = useStrava((s) => s.clear);

  const [draftId, setDraftId] = useState(clientId ?? "");
  const [draftSecret, setDraftSecret] = useState(clientSecret ?? "");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftId(clientId ?? "");
    setDraftSecret(clientSecret ?? "");
  }, [clientId, clientSecret]);

  const connected = !!accessToken;

  const onConnect = () => {
    const id = draftId.trim();
    const secret = draftSecret.trim();
    if (!id || !secret) return;
    setStravaCredentials({ clientId: id, clientSecret: secret });
    startStravaOAuth(id);
  };

  const onDisconnect = async () => {
    clearStrava();
    await clearActivities();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Strava</Label>
        {connected && (
          <span className="text-xs opacity-60">
            Connected{athleteId ? ` · athlete #${athleteId}` : ""}
          </span>
        )}
      </div>

      {!connected && (
        <>
          <p className="text-xs opacity-60">
            Create a personal API app at{" "}
            <a
              href="https://www.strava.com/settings/api"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              strava.com/settings/api
            </a>
            . Set the Authorization Callback Domain to <code>{window.location.hostname}</code>.
          </p>
          <div className="flex flex-col gap-2">
            <Input
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              placeholder="Client ID"
              autoComplete="off"
            />
            <Input
              type="password"
              value={draftSecret}
              onChange={(e) => setDraftSecret(e.target.value)}
              placeholder="Client Secret"
              autoComplete="off"
            />
          </div>
          <div>
            <Button
              onClick={onConnect}
              disabled={!draftId.trim() || !draftSecret.trim()}
              className="bg-[#FC4C02] hover:bg-[#E04400] text-white"
            >
              Connect Strava
            </Button>
          </div>
        </>
      )}

      {connected && (
        <div className="flex flex-col gap-2">
          <p className="text-xs opacity-60">
            {activities.length} run{activities.length === 1 ? "" : "s"} cached
            {lastSyncedAt
              ? ` · synced ${formatDistanceToNow(parseISO(lastSyncedAt), { addSuffix: true })}`
              : " · not yet synced"}
          </p>
          {stravaError && <p className="text-xs text-red-600">{stravaError}</p>}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => void sync()} disabled={syncing}>
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
            <button
              type="button"
              onClick={() => void onDisconnect()}
              className="text-xs underline opacity-60 hover:opacity-100"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OuraSection() {
  const clientId = useSettings((s) => s.ouraClientId);
  const connected = useSettings((s) => !!s.ouraAccessToken);
  const setClientId = useSettings((s) => s.setOuraClientId);
  const clearOura = useSettings((s) => s.clearOura);
  const days = useOura((s) => s.days);
  const lastSyncedAt = useOura((s) => s.lastSyncedAt);
  const syncing = useOura((s) => s.syncing);
  const ouraError = useOura((s) => s.error);
  const sync = useOura((s) => s.sync);
  const clearDays = useOura((s) => s.clear);
  const [draftId, setDraftId] = useState(clientId ?? "");
  const nights = Object.keys(days).length;

  const onConnect = () => {
    const id = draftId.trim();
    if (!id) return;
    setClientId(id);
    startOuraOAuth(id);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Oura</Label>
        {connected && <span className="text-xs opacity-60">Connected</span>}
      </div>
      {!connected && (
        <>
          <p className="text-xs opacity-60">
            Bring sleep, HRV and readiness into your coach. Create an app at{" "}
            <a href="https://cloud.ouraring.com/oauth/applications" target="_blank" rel="noreferrer" className="underline">
              cloud.ouraring.com/oauth/applications
            </a>{" "}
            with redirect URI <code>{window.location.origin + window.location.pathname}</code>.
          </p>
          <Input
            value={draftId}
            onChange={(e) => setDraftId(e.target.value)}
            placeholder="Client ID"
            autoComplete="off"
          />
          <div>
            <Button onClick={onConnect} disabled={!draftId.trim()} className="bg-[#2f3a8f] text-white hover:bg-[#252e73]">
              Connect Oura
            </Button>
          </div>
        </>
      )}
      {connected && (
        <div className="flex flex-col gap-2">
          <p className="text-xs opacity-60">
            {nights} night{nights === 1 ? "" : "s"} synced
            {lastSyncedAt ? ` · ${formatDistanceToNow(parseISO(lastSyncedAt), { addSuffix: true })}` : ""}
          </p>
          {ouraError && <p className="text-xs text-red-600">{ouraError}</p>}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => void sync()} disabled={syncing}>
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
            <button
              type="button"
              onClick={() => {
                clearOura();
                void clearDays();
              }}
              className="text-xs underline opacity-60 hover:opacity-100"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
