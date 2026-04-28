import { DotSeparator } from "@/components/DotSeparator";
import { FontPicker } from "@/components/statusbar/FontPicker";
import { DaysUntilRace } from "@/components/statusbar/DaysUntilRace";
import { RunsCompleted } from "@/components/statusbar/RunsCompleted";
import { EditPlanLink } from "@/components/statusbar/EditPlanLink";
import { PlanOverviewLink } from "@/components/statusbar/PlanOverviewLink";
import { SidebarToggleLink } from "@/components/statusbar/SidebarToggleLink";
import { ConnectionsLink, ConnectionsStatus } from "@/components/statusbar/ConnectionsLink";
import { useUiMode } from "@/store/useUiMode";

export function LeftStatusBar() {
  const sidebarMode = useUiMode((s) => s.sidebarMode);
  const coachMode = sidebarMode === "coach";
  return (
    <div
      className="chrome-group absolute bottom-6 left-[120px] flex items-center gap-3 font-normal text-black/55"
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
    <div className="chrome-group flex items-center gap-3">
      <PlanOverviewLink />
      <DotSeparator />
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
