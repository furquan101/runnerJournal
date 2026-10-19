import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRunDetails } from "@/store/useRunDetails";
import { decodePolyline } from "@/lib/polyline";
import { fmtPace, metersToMiles, paceMinPerMile } from "@/lib/runStats";
import { runInsights } from "@/lib/runInsights";
import { isDemo } from "@/demo/demo";
import type { StravaActivity } from "@/types";

const STRAVA_ORANGE = "#FC4C02";

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/** Strava route map, headline stats and split insights for a long run. */
export function RunMapCard({ activity }: { activity: StravaActivity }) {
  const load = useRunDetails((s) => s.load);
  const detail = useRunDetails((s) => s.details[activity.id]);
  useEffect(() => {
    void load(activity.id);
  }, [activity.id, load]);

  const polyline = detail?.polyline || activity.summaryPolyline || "";
  const points = useMemo(() => (polyline ? decodePolyline(polyline) : []), [polyline]);
  const insights = useMemo(() => runInsights(detail?.splits ?? []), [detail]);
  const pace = paceMinPerMile(activity.distanceMeters, activity.movingTimeSec);

  const stats = [
    { label: "Distance", value: `${metersToMiles(activity.distanceMeters).toFixed(1)} mi` },
    { label: "Time", value: fmtDuration(activity.movingTimeSec) },
    { label: "Pace", value: pace ? fmtPace(pace) : "–" },
    ...(activity.averageHeartrate ? [{ label: "Avg HR", value: `${Math.round(activity.averageHeartrate)} bpm` }] : []),
  ];

  return (
    <div className="flex max-w-[856px] overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {points.length > 1 && <RouteMap points={points} />}
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-base text-black">{activity.name}</p>
          {!isDemo && (
            <a
              href={`https://www.strava.com/activities/${activity.id}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs font-medium text-[#FC4C02] hover:underline"
            >
              View on Strava
            </a>
          )}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wide opacity-50">{s.label}</span>
              <span className="text-lg text-black">{s.value}</span>
            </div>
          ))}
        </div>
        {insights.length > 0 && (
          <ul className="flex flex-col gap-1.5 border-t border-neutral-100 pt-3">
            {insights.map((line) => (
              <li key={line} className="flex gap-2 text-sm text-black/75">
                <span className="mt-[7px] inline-block size-1.5 shrink-0 rounded-full" style={{ background: STRAVA_ORANGE }} />
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RouteMap({ points }: { points: [number, number][] }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      className: "rj-muted-tiles",
    }).addTo(map);
    const line = L.polyline(points, { color: STRAVA_ORANGE, weight: 4, opacity: 0.95, lineJoin: "round" }).addTo(map);
    L.circleMarker(points[0], { radius: 5, color: "#fff", weight: 2, fillColor: "#16a34a", fillOpacity: 1 }).addTo(map);
    L.circleMarker(points[points.length - 1], { radius: 5, color: "#fff", weight: 2, fillColor: "#111", fillOpacity: 1 }).addTo(map);
    map.fitBounds(line.getBounds(), { padding: [18, 18] });
    map.attributionControl.setPrefix(false);
    return () => {
      map.remove();
    };
  }, [points]);
  return <div ref={el} className="h-[230px] w-[46%] shrink-0 bg-neutral-100" />;
}
