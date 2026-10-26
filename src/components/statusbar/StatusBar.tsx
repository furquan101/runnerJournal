import { DotSeparator } from "@/components/DotSeparator";
import { FontPicker } from "@/components/statusbar/FontPicker";
import { DaysUntilRace } from "@/components/statusbar/DaysUntilRace";
import { RunsCompleted } from "@/components/statusbar/RunsCompleted";
import { EditPlanLink } from "@/components/statusbar/EditPlanLink";
import { SidebarModeLinks } from "@/components/statusbar/SidebarModeLinks";
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
          <ConnectionsLink />
        </>
      ) : (
        <>
          <FontPicker />
          <DotSeparator />
          <DaysUntilRace />
          <DotSeparator />
          <RunsCompleted />
          <DotSeparator />
          <EditPlanLink />
        </>
      )}
    </div>
  );
}

export function RightStatusBar() {
  return (
    <div className="chrome-group flex flex-wrap items-center gap-3">
      <SidebarModeLinks />
    </div>
  );
}
