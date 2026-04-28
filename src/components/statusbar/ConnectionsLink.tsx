import { useUiMode } from "@/store/useUiMode";
import { useSettings } from "@/store/useSettings";

export function ConnectionsLink() {
  const open = useUiMode((s) => s.openConnectionsDialog);
  return (
    <button
      type="button"
      onClick={open}
      className="text-sm hover:underline focus:outline-none"
    >
      Connections
    </button>
  );
}

export function ConnectionsStatus() {
  const stravaConnected = useSettings((s) => !!s.stravaAccessToken);
  return (
    <span className="text-sm">
      Strava {stravaConnected ? "connected" : "not connected"}
    </span>
  );
}
