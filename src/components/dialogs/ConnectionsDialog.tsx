import { Fragment, useEffect, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ChevronDownIcon } from "@radix-ui/react-icons";
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
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useUiMode } from "@/store/useUiMode";
import { useSettings } from "@/store/useSettings";
import { useStrava } from "@/store/useStrava";
import { startStravaOAuth } from "@/lib/stravaOAuth";

type ProviderId =
  | "strava"
  | "oura"
  | "whoop"
  | "garmin"
  | "polar"
  | "apple-health"
  | "fitbit"
  | "coros";

type ProviderMeta = { id: ProviderId; label: string; status: "live" | "soon" };

const PROVIDERS: ProviderMeta[] = [
  { id: "strava", label: "Strava", status: "live" },
  { id: "oura", label: "Oura", status: "soon" },
  { id: "whoop", label: "Whoop", status: "soon" },
  { id: "garmin", label: "Garmin", status: "soon" },
  { id: "polar", label: "Polar", status: "soon" },
  { id: "apple-health", label: "Apple Health", status: "soon" },
  { id: "fitbit", label: "Fitbit", status: "soon" },
  { id: "coros", label: "Coros", status: "soon" },
];

type Slot = { key: string; provider: ProviderId | null };

const newSlot = (): Slot => ({
  key: crypto.randomUUID(),
  provider: null,
});

export function ConnectionsDialog() {
  const open = useUiMode((s) => s.connectionsDialogOpen);
  const close = useUiMode((s) => s.closeConnectionsDialog);
  const apiKey = useSettings((s) => s.openRouterKey);
  const setApiKey = useSettings((s) => s.setOpenRouterKey);

  const [draftKey, setDraftKey] = useState(apiKey ?? "");
  const [slots, setSlots] = useState<Slot[]>([newSlot()]);

  useEffect(() => {
    if (open) {
      setDraftKey(apiKey ?? "");
      setSlots([newSlot()]);
    }
  }, [open, apiKey]);

  const onSave = () => {
    setApiKey(draftKey.trim() || null);
    close();
  };

  const usedProviders = new Set(
    slots.map((s) => s.provider).filter((p): p is ProviderId => !!p),
  );

  const setProvider = (key: string, provider: ProviderId | null) => {
    setSlots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, provider } : s)),
    );
  };

  const removeSlot = (key: string) => {
    setSlots((prev) => prev.filter((s) => s.key !== key));
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, newSlot()]);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-normal">Connections</DialogTitle>
          <DialogDescription className="opacity-70">
            Hook your coach up to OpenRouter and your favourite tracker.
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

          <div className="flex flex-col">
            {slots.map((slot, i) => (
              <Fragment key={slot.key}>
                {i > 0 && <Separator className="my-4" />}
                <ConnectionSlot
                  slot={slot}
                  usedProviders={usedProviders}
                  onChange={(provider) => setProvider(slot.key, provider)}
                  onRemove={
                    slots.length > 1 ? () => removeSlot(slot.key) : undefined
                  }
                />
              </Fragment>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="self-start mt-4"
              onClick={addSlot}
            >
              + Add more
            </Button>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConnectionSlot({
  slot,
  usedProviders,
  onChange,
  onRemove,
}: {
  slot: Slot;
  usedProviders: Set<ProviderId>;
  onChange: (p: ProviderId | null) => void;
  onRemove?: () => void;
}) {
  const meta = slot.provider
    ? PROVIDERS.find((p) => p.id === slot.provider) ?? null
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="justify-between min-w-[200px]"
            >
              <span>{meta?.label ?? "Choose provider"}</span>
              <ChevronDownIcon className="ml-2 h-4 w-4 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[200px]">
            {PROVIDERS.map((p) => {
              const taken = usedProviders.has(p.id) && p.id !== slot.provider;
              const comingSoon = p.status === "soon";
              return (
                <DropdownMenuItem
                  key={p.id}
                  disabled={taken || comingSoon}
                  onSelect={() => onChange(p.id)}
                  className="flex items-center justify-between gap-6"
                >
                  <span>{p.label}</span>
                  {comingSoon && (
                    <span className="text-xs opacity-50">Coming soon</span>
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {onRemove && (
          <button
            type="button"
            aria-label="Remove connection"
            onClick={onRemove}
            className="text-base opacity-50 hover:opacity-100 px-2 leading-none"
          >
            ×
          </button>
        )}
      </div>

      {slot.provider === "strava" && <StravaBody />}
      {meta?.status === "soon" && (
        <p className="text-xs opacity-60">
          {meta.label} integration is coming soon.
        </p>
      )}
    </div>
  );
}

function StravaBody() {
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

  if (!connected) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs opacity-60">
        Connected{athleteId ? ` · athlete #${athleteId}` : ""}
      </p>
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
  );
}
