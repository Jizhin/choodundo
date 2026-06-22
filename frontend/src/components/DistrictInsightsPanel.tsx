import { useQuery } from "@tanstack/react-query";
import { fetchDistricts, fetchHourlyStats } from "../api/client";
import { useStore } from "../store/useStore";
import type { DistrictSummary, FeedItem, HourlyBucket } from "../types";

function lastReportTime(feed: FeedItem[], district: string): string {
  const item = feed.find((f) => f.district.toLowerCase() === district.toLowerCase());
  return item ? item.time : "—";
}

function hourLabel(h: number): string {
  if (h === 0) return "12AM";
  if (h === 12) return "12PM";
  return h < 12 ? `${h}AM` : `${h - 12}PM`;
}

function TrendChart({ data }: { data: HourlyBucket[] }) {
  if (data.length === 0) {
    return (
      <div style={{ height: "100px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "11px", color: "#6A5A4B", margin: 0 }}>No data yet today</p>
      </div>
    );
  }
  const maxVal = Math.max(...data.flatMap((d) => [d.hot, d.normal]), 1);
  const barH = 70;
  const barW = 5;
  const gap = 1;
  const groupW = barW * 2 + gap + 5;
  const svgW = Math.max(data.length * groupW + 8, 200);

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "10px", overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <svg width={svgW} height={barH + 18} style={{ display: "block", minWidth: "100%" }}>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={0} y1={barH - f * barH} x2={svgW} y2={barH - f * barH}
              stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
          ))}
          {data.map((d, i) => {
            const x = i * groupW + 4;
            const hH = Math.max((d.hot / maxVal) * barH, d.hot > 0 ? 2 : 0);
            const nH = Math.max((d.normal / maxVal) * barH, d.normal > 0 ? 2 : 0);
            const showLabel = data.length <= 10 || i % Math.ceil(data.length / 8) === 0;
            return (
              <g key={d.hour}>
                {d.hot > 0 && <rect x={x} y={barH - hH} width={barW} height={hH} fill="#FF8A00" rx={2} />}
                {d.normal > 0 && <rect x={x + barW + gap} y={barH - nH} width={barW} height={nH} fill="#22C55E" rx={2} />}
                {showLabel && (
                  <text x={x + barW} y={barH + 14} textAnchor="middle" fontSize="8"
                    fill="#6A5A4B" fontFamily="Inter, sans-serif">
                    {hourLabel(d.hour)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ marginTop: "6px", display: "flex", gap: "12px" }}>
        {[{ color: "#FF8A00", label: "Hot" }, { color: "#22C55E", label: "Not Hot" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: color, display: "inline-block" }} />
            <span style={{ fontSize: "10px", color: "#6A5A4B" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DistrictInsightsPanel({
  district,
  districtData,
}: {
  district: string;
  districtData: DistrictSummary | undefined;
}) {
  const feed = useStore((s) => s.feed);

  const { data: allDistricts } = useQuery({
    queryKey: ["districts"],
    queryFn: fetchDistricts,
    refetchInterval: 30_000,
  });

  const { data: hourly = [] } = useQuery({
    queryKey: ["hourly"],
    queryFn: fetchHourlyStats,
    refetchInterval: 60_000,
  });

  const hot = districtData?.hot ?? 0;
  const normal = districtData?.normal ?? 0;
  const total = districtData?.total ?? 0;
  const pct = total > 0 ? Math.round((hot / total) * 100) : 0;
  const lastTime = lastReportTime(feed, district);

  // Top districts by total reports
  const topDistricts = [...(allDistricts?.districts ?? [])]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "rgba(255,138,0,0.15)",
              border: "1px solid rgba(255,138,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
            }}
          >
            📍
          </div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFF5E6" }}>
            District Overview
          </span>
        </div>
        <span style={{ fontSize: "10px", color: "#6A5A4B" }}>
          {lastTime !== "—" ? `Last updated: ${lastTime}` : "No reports yet"}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "14px" }}>

        {/* Selected district quick stats */}
        <div>
          <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 700, color: "#9A8B7C", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {district} District
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {[
              { label: "HOT", value: hot, color: "#FF8A00", bg: "rgba(255,138,0,0.10)", border: "rgba(255,138,0,0.18)" },
              { label: "COOL", value: normal, color: "#22C55E", bg: "rgba(34,197,94,0.10)", border: "rgba(34,197,94,0.18)" },
              { label: "TOTAL", value: total, color: "#FFF5E6", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.08)" },
            ].map(({ label, value, color, bg, border }) => (
              <div
                key={label}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: "14px",
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <p style={{ margin: 0, fontSize: "9px", fontWeight: 700, color: "#9A8B7C", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: 800, lineHeight: 1, color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hot/cool bar */}
        {total > 0 && (
          <div>
            <div style={{ height: "8px", borderRadius: "999px", overflow: "hidden", display: "flex", marginBottom: "5px" }}>
              <div style={{ width: `${pct}%`, background: "linear-gradient(to right, #FF8A00, #FF5A3D)", minWidth: pct > 0 ? "3px" : "0" }} />
              <div style={{ flex: 1, background: "linear-gradient(to right, #16A34A, #22C55E)", minWidth: 100 - pct > 0 ? "3px" : "0" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: 600 }}>
              <span style={{ color: "#FF8A00" }}>{pct}% Hot</span>
              <span style={{ color: "#22C55E" }}>{100 - pct}% Cool</span>
            </div>
          </div>
        )}

        {/* Reports by district */}
        <div>
          <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 700, color: "#9A8B7C", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Reports by District
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {topDistricts.map((d, i) => {
              const maxTotal = topDistricts[0]?.total ?? 1;
              const barWidth = maxTotal > 0 ? (d.total / maxTotal) * 100 : 0;
              return (
                <div key={d.district} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#6A5A4B", width: "14px", textAlign: "right" }}>{i + 1}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#D9C8B6", width: "90px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.district}
                  </span>
                  <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: `${barWidth}%`, height: "100%", background: "#FF8A00", borderRadius: "999px" }} />
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: "#9A8B7C", width: "48px", textAlign: "right", flexShrink: 0 }}>
                    {d.total} reports
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trend chart */}
        <div>
          <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 700, color: "#9A8B7C", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Reports Trend (Today)
          </p>
          <TrendChart data={hourly} />
        </div>
      </div>
    </div>
  );
}
