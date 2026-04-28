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
import { Switch } from "@/components/ui/switch";
import { useUiMode } from "@/store/useUiMode";
import { useSettings } from "@/store/useSettings";
import { useStrava } from "@/store/useStrava";
import { startStravaOAuth } from "@/lib/stravaOAuth";

export function ConnectionsDialog() {
  const open = useUiMode((s) => s.connectionsDialogOpen);
  const close = useUiMode((s) => s.closeConnectionsDialog);
  const apiKey = useSettings((s) => s.openRouterKey);
  const setApiKey = useSettings((s) => s.setOpenRouterKey);
  const ouraConnected = useSettings((s) => s.ouraConnected);
  const setOuraConnected = useSettings((s) => s.setOuraConnected);

  const [draftKey, setDraftKey] = useState(apiKey ?? "");
  useEffect(() => {
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
            Hook your coach up to OpenRouter and Strava.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 pt-2">
          <div className="flex flex-col gap-2">
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
          </div>

          <StravaSection />

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm">Oura</Label>
              <p className="text-xs opacity-60">Bring sleep + HRV into your coach (coming soon)</p>
            </div>
            <Switch checked={ouraConnected} onCheckedChange={setOuraConnected} />
          </div>

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
