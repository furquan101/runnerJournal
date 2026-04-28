import type { ReactNode } from "react";
import { RightStatusBar } from "@/components/statusbar/StatusBar";

export function SidebarShell({ children }: { children: ReactNode }) {
  return (
    <aside className="h-full w-[391px] border-l-2 border-[#dedede] bg-[#fafafa] flex flex-col">
      <div className="flex-1 px-5 pt-16 pb-4 overflow-y-auto chrome-group min-h-0">
        {children}
      </div>
      <div className="px-5 pb-6 pt-2 flex justify-end">
        <RightStatusBar />
      </div>
    </aside>
  );
}
