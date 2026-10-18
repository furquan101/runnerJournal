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
  return (
    <span className="flex items-center gap-2 text-sm text-black">
      <span
        className={"inline-block size-2 rounded-full " + (stravaConnected ? "bg-[#FC4C02]" : "bg-neutral-300")}
        aria-hidden
      />
      Strava {stravaConnected ? "connected" : "not connected"}
    </span>
  );
}
