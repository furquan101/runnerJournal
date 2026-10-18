import { DotSeparator } from "@/components/DotSeparator";
import { FontPicker } from "@/components/statusbar/FontPicker";
import { DaysUntilRace } from "@/components/statusbar/DaysUntilRace";
import { RunsCompleted } from "@/components/statusbar/RunsCompleted";
import { EditPlanLink } from "@/components/statusbar/EditPlanLink";
import { SidebarToggleLink } from "@/components/statusbar/SidebarToggleLink";
import { ConnectionsLink, ConnectionsStatus } from "@/components/statusbar/ConnectionsLink";
import { useUiMode } from "@/store/useUiMode";

export function LeftStatusBar() {
  const sidebarMode = useUiMode((s) => s.sidebarMode);
  const coachMode = sidebarMode === "coach";
  return (
    <div
      className="chrome-group flex flex-wrap items-center gap-3 px-6 pb-6 md:absolute md:bottom-6 md:left-[120px] md:p-0"
      style={{ zIndex: 5 }}
    >
      {coachMode ? (
        <>
          <ConnectionsStatus />
          <DotSeparator />
          <DaysUntilRace />
        </>
      ) : (
        <>
          <FontPicker />
          <DotSeparator />
          <DaysUntilRace />
          <DotSeparator />
          <RunsCompleted />
        </>
      )}
    </div>
  );
}

export function RightStatusBar() {
  const sidebarMode = useUiMode((s) => s.sidebarMode);
  const coachMode = sidebarMode === "coach";
  return (
    <div className="chrome-group flex flex-wrap items-center gap-3">
      <EditPlanLink />
      <DotSeparator />
      <SidebarToggleLink />
      {coachMode && (
        <>
          <DotSeparator />
          <ConnectionsLink />
        </>
      )}
    </div>
  );
}
