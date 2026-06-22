import { useQuery } from "@tanstack/react-query";
import { fetchDistricts } from "../api/client";
import type { DistrictSummary } from "../types";

const RANK_COLOR  = ["#F59E0B", "#9CA3AF", "#B45309", "#6B7280"];
const RANK_BORDER = ["rgba(245,158,11,0.40)", "rgba(156,163,175,0.30)", "rgba(180,83,9,0.40)", "rgba(107,114,128,0.25)"];

// Deterministic sparkline
function makeSparkData(seed: string, base: number, n = 10): number[] {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = ((s * 31) + seed.charCodeAt(i)) >>> 0;
  const rand = (): number => { s = ((s * 1664525) + 1013904223) >>> 0; return s / 4294967295; };
  const b = base / 100;
  return Array.from({ length: n }, () => Math.max(0.05, Math.min(0.95, b + (rand() - 0.5) * 0.40)));
}

// Sharp angular lines (no bezier) — matches reference graph style
function makeSparkPath(vals: number[], W: number, H: number): string {
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const r = hi - lo || 0.01;
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * W,
    H - ((v - lo) / r) * H * 0.80 - H * 0.08,
  ]);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`;
  }
  return d;
}

function TopCard({ d, rank }: { d: DistrictSummary; rank: number }) {
  const isHot = d.hot >= d.normal;
  const lineColor = isHot ? "#FF9800" : "#22C55E";
  const gradId = `tg-${rank}`;
  const sparkVals = makeSparkData(d.district, d.hot_percentage);
  const sparkPath = makeSparkPath(sparkVals, 100, 28);
  const areaPath = sparkPath + ` L100,28 L0,28 Z`;
  const rColor = RANK_COLOR[rank - 1] ?? "#6B7280";
  const rBorder = RANK_BORDER[rank - 1] ?? "rgba(107,114,128,0.25)";

  return (
    <div
      style={{
        background: "#0A0A0A",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "4px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        cursor: "pointer",
        transition: "border-color 0.15s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,165,0,0.55)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
    >
      {/* Rank + name + count */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              border: `1px solid ${rBorder}`,
              background: "rgba(255,255,255,0.04)",
              fontSize: "12px",
              fontWeight: 800,
              color: rColor,
              flexShrink: 0,
            }}
          >
            #{rank}
          </span>
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2 }}>
              {d.district}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#7D7D7D" }}>
              {d.total} reports
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: "22px",
            fontWeight: 800,
            color: "#FFFFFF",
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {d.total}
        </span>
      </div>

      {/* Sparkline */}
      <svg
        width="100%"
        height="28"
        viewBox="0 0 100 28"
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.20" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={sparkPath} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Stats */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {d.extreme_hot > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#FF3B30", display: "inline-block" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#FF3B30" }}>{d.extreme_hot}</span>
            <span style={{ fontSize: "9px", color: "#7D7D7D" }}>Extreme</span>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#FF9800", display: "inline-block" }} />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#EAEAEA" }}>{d.hot}</span>
          <span style={{ fontSize: "9px", color: "#7D7D7D" }}>Hot</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#EAEAEA" }}>{d.normal}</span>
          <span style={{ fontSize: "9px", color: "#7D7D7D" }}>Not Hot</span>
        </div>
      </div>
    </div>
  );
}

export default function TopDistricts() {
  const { data } = useQuery({
    queryKey: ["districts"],
    queryFn: fetchDistricts,
    refetchInterval: 30_000,
  });

  const top4 = [...(data?.districts ?? [])]
    .filter((d) => d.total > 0)
    .sort((a: DistrictSummary, b: DistrictSummary) => b.total - a.total)
    .slice(0, 4);

  if (top4.length === 0) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "14px" }}>
        <h2 style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#C5C5C5", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          TOP DISTRICTS RIGHT NOW
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {top4.map((d, i) => (
          <TopCard key={d.district} d={d} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
