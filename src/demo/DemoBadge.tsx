import { clear } from "idb-keyval";
import { isDemo } from "@/demo/demo";

export function DemoBadge() {
  if (!isDemo) return null;
  const reset = async () => {
    await clear();
    localStorage.clear();
    location.reload();
  };
  return (
    <div className="fixed left-4 top-4 z-40 flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-3 py-1 text-xs text-black/70 shadow-sm backdrop-blur">
      <span className="inline-block size-1.5 rounded-full bg-[#FC4C02]" aria-hidden />
      Demo · sample data
      <button type="button" onClick={() => void reset()} className="underline opacity-70 hover:opacity-100">
        Reset
      </button>
    </div>
  );
}
