import { useState } from "react";
import { COACH_NAME } from "@/lib/openrouter";

// Drop the coach's photo at public/coach-bennet.jpg; until then this shows initials.
const PHOTO = `${import.meta.env.BASE_URL}coach-bennet.jpg`;

export function CoachAvatar({ size = 44 }: { size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = COACH_NAME.replace(/^Coach\s+/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return failed ? (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-[#0e3460] font-medium text-white"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials}
    </span>
  ) : (
    <img
      src={PHOTO}
      alt={COACH_NAME}
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
