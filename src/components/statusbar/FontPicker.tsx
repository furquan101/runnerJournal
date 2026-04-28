import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSettings } from "@/store/useSettings";
import type { FontFamily } from "@/types";

const FONTS: FontFamily[] = ["Rubik", "Lato", "Times New Roman", "System Sans"];

export function FontPicker() {
  const fontFamily = useSettings((s) => s.fontFamily);
  const setFontFamily = useSettings((s) => s.setFontFamily);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-sm text-black hover:underline focus:outline-none">
        Fonts
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {FONTS.map((f) => (
          <DropdownMenuItem
            key={f}
            onSelect={() => setFontFamily(f)}
            className={fontFamily === f ? "font-medium" : ""}
          >
            {f}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
