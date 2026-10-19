import { useUiMode } from "@/store/useUiMode";
import { useSettings } from "@/store/useSettings";

export function ConnectionsLink() {
  const open = useUiMode((s) => s.openConnectionsDialog);
  return (
    <button
      type="button"
      onClick={open}
      className="text-sm text-black hover:underline focus:outline-none"
    >
      Connections
    </button>
  );
}

export function ConnectionsStatus() {
  const stravaConnected = useSettings((s) => !!s.stravaAccessToken);
  const ouraConnected = useSettings((s) => !!s.ouraAccessToken);
  return (
    <>
      <Status label="Strava" connected={stravaConnected} color="bg-[#FC4C02]" />
      <Status label="Oura" connected={ouraConnected} color="bg-[#2f3a8f]" />
    </>
  );
}

function Status({ label, connected, color }: { label: string; connected: boolean; color: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-black">
      <span className={"inline-block size-2 rounded-full " + (connected ? color : "bg-neutral-300")} aria-hidden />
      {label} {connected ? "connected" : "not connected"}
    </span>
  );
}
