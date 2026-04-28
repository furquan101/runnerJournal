import { useUiMode } from "@/store/useUiMode";

export function EditPlanLink() {
  const open = useUiMode((s) => s.openPlanDialog);
  return (
    <button
      type="button"
      onClick={open}
      className="text-sm hover:underline focus:outline-none"
    >
      Edit plan
    </button>
  );
}
