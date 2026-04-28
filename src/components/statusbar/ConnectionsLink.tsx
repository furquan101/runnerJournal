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
  const ouraConnected = useSettings((s) => s.ouraConnected);
  return (
    <>
      <span className="text-sm text-black">
        Strava {stravaConnected ? "connected" : "not connected"}
      </span>
      <span className="text-sm text-black">
        Oura {ouraConnected ? "connected" : "not connected"}
      </span>
    </>
  );
}
