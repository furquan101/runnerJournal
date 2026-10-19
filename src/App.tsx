import { useEffect, useRef } from "react";
import { useEntries } from "@/store/useEntries";
import { useSettings, FONT_STACKS } from "@/store/useSettings";
import { usePlan } from "@/store/usePlan";
import { useStrava } from "@/store/useStrava";
import { handleStravaOAuthCallback } from "@/lib/stravaOAuth";
import { handleOuraCallback, isOuraCallback } from "@/lib/oura";
import { useOura } from "@/store/useOura";
import { PlanCreatorDialog } from "@/components/dialogs/PlanCreatorDialog";
import { ConnectionsDialog } from "@/components/dialogs/ConnectionsDialog";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { SidebarShell } from "@/components/sidebar/SidebarShell";
import { WorkoutSidebar } from "@/components/sidebar/WorkoutSidebar";
import { CoachSidebar } from "@/components/sidebar/CoachSidebar";
import { JournalSidebar } from "@/components/sidebar/JournalSidebar";
import { LeftStatusBar } from "@/components/statusbar/StatusBar";
import { useUiMode } from "@/store/useUiMode";
import { DemoBadge } from "@/demo/DemoBadge";

export default function App() {
  const hydrate = useEntries((s) => s.hydrate);
  const hydrateStrava = useStrava((s) => s.hydrate);
  const syncStrava = useStrava((s) => s.sync);
  const hydrateOura = useOura((s) => s.hydrate);
  const syncOura = useOura((s) => s.sync);
  const fontFamily = useSettings((s) => s.fontFamily);
  const fontSize = useSettings((s) => s.fontSize);
  const plan = usePlan((s) => s.plan);
  const sidebarMode = useUiMode((s) => s.sidebarMode);
  const oauthRanRef = useRef(false);

  useEffect(() => {
    void hydrate();
    void hydrateStrava();
    void hydrateOura();
  }, [hydrate, hydrateStrava, hydrateOura]);

  useEffect(() => {
    if (oauthRanRef.current) return;
    oauthRanRef.current = true;
    if (isOuraCallback()) {
      if (handleOuraCallback().ok) void syncOura();
      return;
    }
    const search = window.location.search;
    if (!search.includes("code=") && !search.includes("error=")) return;
    void (async () => {
      const result = await handleStravaOAuthCallback();
      if (result?.ok) {
        await syncStrava();
      }
    })();
  }, [syncStrava, syncOura]);

  useEffect(() => {
    document.documentElement.style.setProperty("--rj-font-family", FONT_STACKS[fontFamily]);
    document.documentElement.style.setProperty("--rj-font-size", `${fontSize}px`);
  }, [fontFamily, fontSize]);

  return (
    <div className="min-h-screen md:h-screen w-full bg-white text-black md:overflow-hidden flex flex-col md:flex-row relative">
      <div className="flex-1 min-w-0 min-h-[60vh] md:min-h-0 relative flex flex-col">
        {plan && <JournalEditor />}
        {plan && <LeftStatusBar />}
      </div>
      {plan && (
        <SidebarShell>
          {sidebarMode === "workouts" ? (
            <WorkoutSidebar />
          ) : sidebarMode === "journal" ? (
            <JournalSidebar />
          ) : (
            <CoachSidebar />
          )}
        </SidebarShell>
      )}
      <DemoBadge />
      <PlanCreatorDialog />
      <ConnectionsDialog />
    </div>
  );
}
