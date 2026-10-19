import { Fragment } from "react";
import { DotSeparator } from "@/components/DotSeparator";
import { useUiMode } from "@/store/useUiMode";
import type { SidebarMode } from "@/types";

const MODES: { mode: SidebarMode; label: string }[] = [
  { mode: "workouts", label: "Workouts" },
  { mode: "journal", label: "Journal" },
  { mode: "coach", label: "Coach insights" },
];

export function SidebarModeLinks() {
  const sidebarMode = useUiMode((s) => s.sidebarMode);
  const setSidebarMode = useUiMode((s) => s.setSidebarMode);
  return (
    <>
      {MODES.map(({ mode, label }, i) => (
        <Fragment key={mode}>
          {i > 0 && <DotSeparator />}
          <button
            type="button"
            onClick={() => setSidebarMode(mode)}
            aria-pressed={sidebarMode === mode}
            className={
              "text-sm text-black hover:underline focus:outline-none " +
              (sidebarMode === mode ? "font-medium" : "opacity-60")
            }
          >
            {label}
          </button>
        </Fragment>
      ))}
    </>
  );
}
