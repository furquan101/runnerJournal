import type { Feel } from "@/types";

const OPTIONS: { value: Feel; label: string; active: string }[] = [
  { value: "good", label: "Good run", active: "bg-emerald-50 border-emerald-600 text-emerald-800" },
  { value: "okay", label: "Okay", active: "bg-amber-50 border-amber-500 text-amber-800" },
  { value: "tough", label: "Tough one", active: "bg-rose-50 border-rose-500 text-rose-800" },
];

export function FeelPicker({
  value,
  onChange,
}: {
  value?: Feel;
  onChange: (feel: Feel | undefined) => void;
}) {
  return (
    <div className="chrome flex flex-wrap items-center gap-2 text-sm">
      <span className="mr-1 opacity-60">How did it feel?</span>
      {OPTIONS.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? undefined : o.value)}
            className={
              "rounded-full border px-3 py-1 transition " +
              (selected ? o.active : "border-neutral-200 text-black/70 hover:border-black/40")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
