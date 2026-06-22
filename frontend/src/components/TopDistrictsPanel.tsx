import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDistricts } from "../api/client";
import { useStore } from "../store/useStore";
import type { DistrictSummary } from "../types";
import DistrictReportsModal from "./DistrictReportsModal";

const RANK_COLORS = ["#F59E0B", "#9CA3AF", "#B45309"];

const ML_DISTRICT: Record<string, string> = {
  Thiruvananthapuram: "തിരുവനന്തപുരം",
  Kollam: "കൊല്ലം",
  Pathanamthitta: "പത്തനംതിട്ട",
  Alappuzha: "ആലപ്പുഴ",
  Kottayam: "കോട്ടയം",
  Idukki: "ഇടുക്കി",
  Ernakulam: "എറണാകുളം",
  Thrissur: "തൃശ്ശൂർ",
  Palakkad: "പാലക്കാട്",
  Malappuram: "മലപ്പുറം",
  Kozhikode: "കോഴിക്കോട്",
  Wayanad: "വയനാട്",
  Kannur: "കണ്ണൂർ",
  Kasaragod: "കാസർഗോഡ്",
};

function levelLabelMl(level: string) {
  if (level === "RED") return "അതിചൂട്";
  if (level === "ORANGE") return "ചൂടുണ്ട്";
  return "ചൂടില്ല";
}

function levelLabelEn(level: string) {
  if (level === "RED") return "VERY HOT";
  if (level === "ORANGE") return "HOT";
  return "NOT HOT";
}

function levelColor(level: string) {
  if (level === "RED") return "#FF3B30";
  if (level === "ORANGE") return "#FF9800";
  return "#22C55E";
}

function DistrictRow({
  d,
  rank,
  lang,
  onClick,
}: {
  d: DistrictSummary;
  rank: number;
  lang: "en" | "ml";
  onClick: () => void;
}) {
  const rColor = RANK_COLORS[rank - 1] ?? "#6B7280";
  const lLabel = lang === "ml" ? levelLabelMl(d.level) : levelLabelEn(d.level);
  const lColor = levelColor(d.level);
  const districtName = lang === "ml" ? (ML_DISTRICT[d.district] ?? d.district) : d.district;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        gap: "10px",
        transition: "background 0.12s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "22px",
            height: "22px",
            borderRadius: "3px",
            background: "rgba(255,255,255,0.05)",
            fontSize: "10px",
            fontWeight: 800,
            color: rColor,
            flexShrink: 0,
          }}
        >
          #{rank}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#EAEAEA", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
            {districtName}
          </p>
          <p style={{ margin: "1px 0 0", fontSize: "10px", color: "#7D7D7D", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
            {d.total} {lang === "ml" ? "റിപ്പോർട്ട്" : `report${d.total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: lColor }}>{d.hot_percentage}%</p>
        <p style={{ margin: "1px 0 0", fontSize: "9px", color: lColor, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>{lLabel}</p>
      </div>
    </div>
  );
}

export default function TopDistrictsPanel() {
  const { data } = useQuery({
    queryKey: ["districts"],
    queryFn: fetchDistricts,
    refetchInterval: 30_000,
  });
  const [selected, setSelected] = useState<DistrictSummary | null>(null);
  const lang = useStore((s) => s.lang);

  const allActive = [...(data?.districts ?? [])]
    .filter((d: DistrictSummary) => d.total > 0)
    .sort((a: DistrictSummary, b: DistrictSummary) =>
      (b.hot + b.extreme_hot) - (a.hot + a.extreme_hot) || b.hot_percentage - a.hot_percentage
    );

  const top3 = allActive.slice(0, 3);

  if (top3.length === 0) return null;

  return (
    <>
      <div
        style={{
          background: "rgba(8,8,8,0.92)",
          border: "1px solid rgba(245,158,11,0.38)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
            {lang === "ml" ? "മുൻനിര ജില്ലകൾ" : "TOP DISTRICTS"}
          </span>
        </div>
        {top3.map((d, i) => (
          <DistrictRow key={d.district} d={d} rank={i + 1} lang={lang} onClick={() => setSelected(d)} />
        ))}
      </div>

      {selected && (
        <DistrictReportsModal
          district={selected.district}
          level={selected.level}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
