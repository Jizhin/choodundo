import { useQuery } from "@tanstack/react-query";
import { useStore } from "../store/useStore";
import { fetchDistricts } from "../api/client";
import type { DistrictSummary, FeedItem } from "../types";

function lastTime(feed: FeedItem[], district: string): string {
  const item = feed.find((f) => f.district.toLowerCase() === district.toLowerCase());
  return item ? item.time : "";
}

function DistrictCard({ d, feed }: { d: DistrictSummary; feed: FeedItem[] }) {
  const time = lastTime(feed, d.district);
  const isHot = d.hot > d.normal;
  const levelColor = isHot ? "#FF9800" : "#22C55E";

  return (
    <div
      style={{
        background: "#24170F",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "24px",
        padding: "16px",
        cursor: "pointer",
        transition: "transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.22s cubic-bezier(.4,0,.2,1)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.25)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "14px", fontWeight: 700, color: "#FFF5E6" }}>{d.district}</span>
        {d.total > 0 && (
          <span
            style={{
              fontSize: "9px",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "999px",
              background: isHot ? "rgba(255,138,0,0.15)" : "rgba(34,197,94,0.12)",
              color: levelColor,
              border: `1px solid ${isHot ? "rgba(255,138,0,0.25)" : "rgba(34,197,94,0.20)"}`,
              letterSpacing: "0.05em",
              textTransform: "uppercase" as const,
            }}
          >
            {isHot ? "Hot" : "Cool"}
          </span>
        )}
      </div>

      {d.total > 0 ? (
        <>
          {/* Stats row */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF3B30", display: "inline-block" }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFF5E6" }}>{d.hot}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFF5E6" }}>{d.normal}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#9A8B7C" }}>{d.total} total</span>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{ width: `${Math.round((d.hot / d.total) * 100)}%`, height: "100%", background: "#FF8A00", borderRadius: "999px" }} />
          </div>
          {time && <p style={{ margin: 0, fontSize: "10px", color: "#6A5A4B" }}>{time}</p>}
        </>
      ) : (
        <p style={{ margin: 0, fontSize: "12px", color: "#3A2A1A", fontStyle: "italic" }}>
          No reports yet
        </p>
      )}
    </div>
  );
}

export default function DistrictPulse() {
  const feed = useStore((s) => s.feed);
  const { data, isLoading } = useQuery({
    queryKey: ["districts"],
    queryFn: fetchDistricts,
    refetchInterval: 30_000,
  });

  const districts = data?.districts ?? [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <span style={{ fontSize: "15px", fontWeight: 700, color: "#FFF5E6", letterSpacing: "-0.2px" }}>
          Explore Districts
        </span>
        {districts.length > 0 && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              background: "rgba(255,138,0,0.12)",
              color: "#FF9800",
              border: "1px solid rgba(255,138,0,0.20)",
              borderRadius: "999px",
              padding: "2px 10px",
            }}
          >
            {districts.length} Districts
          </span>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <p style={{ color: "#6A5A4B", fontSize: "13px" }}>Loading districts…</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {districts.map((d: DistrictSummary) => (
            <DistrictCard key={d.district} d={d} feed={feed} />
          ))}
        </div>
      )}
    </div>
  );
}
