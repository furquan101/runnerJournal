import { useUiMode } from "@/store/useUiMode";

export function SidebarToggleLink() {
  const sidebarMode = useUiMode((s) => s.sidebarMode);
  const toggle = useUiMode((s) => s.toggleSidebar);
  const label = sidebarMode === "workouts" ? "Coach insights" : "Workouts";
  return (
    <button
      type="button"
      onClick={toggle}
      className="text-sm text-black hover:underline focus:outline-none"
    >
      {label}
    </button>
  );
}
