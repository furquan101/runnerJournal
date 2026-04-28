import type { ReactNode } from "react";
import { RightStatusBar } from "@/components/statusbar/StatusBar";
import { useUiMode } from "@/store/useUiMode";

export function SidebarShell({ children }: { children: ReactNode }) {
  const sidebarMode = useUiMode((s) => s.sidebarMode);
  const coachMode = sidebarMode === "coach";
  return (
    <aside className="h-full w-[391px] border-l-2 border-[#dedede] bg-[#fafafa] flex flex-col">
      <div className="flex-1 px-5 pt-6 pb-4 overflow-y-auto chrome-group min-h-0">
        {children}
      </div>
      {!coachMode && (
        <div className="px-5 pb-6 pt-2 flex justify-start">
          <RightStatusBar />
        </div>
      )}
    </aside>
  );
}
