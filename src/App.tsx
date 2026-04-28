import { useEffect, useRef } from "react";
import { useEntries } from "@/store/useEntries";
import { useSettings, FONT_STACKS } from "@/store/useSettings";
import { usePlan } from "@/store/usePlan";
import { useStrava } from "@/store/useStrava";
import { handleStravaOAuthCallback } from "@/lib/stravaOAuth";
import { PlanCreatorDialog } from "@/components/dialogs/PlanCreatorDialog";
import { ConnectionsDialog } from "@/components/dialogs/ConnectionsDialog";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { SidebarShell } from "@/components/sidebar/SidebarShell";
import { WorkoutSidebar } from "@/components/sidebar/WorkoutSidebar";
import { CoachSidebar } from "@/components/sidebar/CoachSidebar";
import { LeftStatusBar } from "@/components/statusbar/StatusBar";
import { useUiMode } from "@/store/useUiMode";

export default function App() {
  const hydrate = useEntries((s) => s.hydrate);
  const hydrateStrava = useStrava((s) => s.hydrate);
  const syncStrava = useStrava((s) => s.sync);
  const fontFamily = useSettings((s) => s.fontFamily);
  const fontSize = useSettings((s) => s.fontSize);
  const plan = usePlan((s) => s.plan);
  const sidebarMode = useUiMode((s) => s.sidebarMode);
  const oauthRanRef = useRef(false);

  useEffect(() => {
    void hydrate();
    void hydrateStrava();
  }, [hydrate, hydrateStrava]);

  useEffect(() => {
    if (oauthRanRef.current) return;
    oauthRanRef.current = true;
    const search = window.location.search;
    if (!search.includes("code=") && !search.includes("error=")) return;
    void (async () => {
      const result = await handleStravaOAuthCallback();
      if (result?.ok) {
        await syncStrava();
      }
    })();
  }, [syncStrava]);

  useEffect(() => {
    document.documentElement.style.setProperty("--rj-font-family", FONT_STACKS[fontFamily]);
    document.documentElement.style.setProperty("--rj-font-size", `${fontSize}px`);
  }, [fontFamily, fontSize]);

  return (
    <div className="h-screen w-screen bg-white text-black overflow-hidden flex relative">
      <div className="flex-1 min-w-0 relative">{plan && <JournalEditor />}</div>
      {plan && (
        <SidebarShell>
          {sidebarMode === "workouts" ? <WorkoutSidebar /> : <CoachSidebar />}
        </SidebarShell>
      )}
      {plan && <LeftStatusBar />}
      <PlanCreatorDialog />
      <ConnectionsDialog />
    </div>
  );
}
