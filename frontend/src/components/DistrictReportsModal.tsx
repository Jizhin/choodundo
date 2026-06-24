import { useState, useEffect, useCallback } from "react";
import { fetchDistrictReports } from "../api/client";
import { useStore } from "../store/useStore";
import type { DistrictReportItem, ReportStatus } from "../types";

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

function statusLabel(s: ReportStatus, lang: "en" | "ml") {
  if (s === "EXTREME_HOT") return lang === "ml" ? "അതിചൂട്" : "EXTREME HOT";
  if (s === "HOT") return lang === "ml" ? "ചൂടുണ്ട്" : "HOT";
  return lang === "ml" ? "ചൂടില്ല" : "NOT HOT";
}

function statusColor(s: ReportStatus) {
  if (s === "EXTREME_HOT") return "#FF3B30";
  if (s === "HOT") return "#FF9800";
  return "#22C55E";
}

function levelLabel(level: string, lang: "en" | "ml") {
  if (level === "RED") return lang === "ml" ? "അതിചൂട്" : "VERY HOT";
  if (level === "ORANGE") return lang === "ml" ? "ചൂടുണ്ട്" : "HOT";
  return lang === "ml" ? "ചൂടില്ല" : "NOT HOT";
}

const LIMIT = 50;

interface Props {
  district: string;
  level: string;
  onClose: () => void;
}

export default function DistrictReportsModal({ district, level, onClose }: Props) {
  const lang = useStore((s) => s.lang);
  const [reports, setReports] = useState<DistrictReportItem[]>([]);
  const [places, setPlaces] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const load = useCallback(
    async (off: number, place: string | null, reset: boolean) => {
      if (off === 0) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await fetchDistrictReports(district, LIMIT, off, place ?? undefined);
        setPlaces(res.places);
        setTotal(res.total);
        if (reset) setReports(res.reports);
        else setReports((prev) => [...prev, ...res.reports]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [district]
  );

  useEffect(() => {
    load(0, null, true);
  }, [load]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handlePlaceFilter = (place: string | null) => {
    setSelectedPlace(place);
    setOffset(0);
    load(0, place, true);
  };

  const handleLoadMore = () => {
    const next = offset + LIMIT;
    setOffset(next);
    load(next, selectedPlace, false);
  };

  const levelColor = level === "RED" ? "#FF3B30" : level === "ORANGE" ? "#FF9800" : "#22C55E";
  const lLabel = levelLabel(level, lang);
  const districtMl = ML_DISTRICT[district] ?? district;
  const mlFont = '"Noto Sans Malayalam", "Inter", sans-serif';

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "780px",
          height: "80vh",
          background: "#0D0D0D",
          border: "1px solid rgba(255,255,255,0.20)",
          borderRadius: "6px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 800,
                color: "#FFFFFF",
                fontFamily: mlFont,
                lineHeight: 1.1,
              }}
            >
              {lang === "ml" ? districtMl : district}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
              <span style={{ fontSize: "12px", color: "#7D7D7D" }}>{district}</span>
              <span
                style={{
                  padding: "2px 7px",
                  borderRadius: "3px",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: levelColor,
                  background: `${levelColor}22`,
                  border: `1px solid ${levelColor}44`,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontFamily: lang === "ml" ? mlFont : "inherit",
                }}
              >
                {lLabel}
              </span>
              <span style={{ fontSize: "11px", color: "#7D7D7D" }}>
                {lang === "ml" ? `ആകെ ${total} റിപ്പോർട്ട്` : `${total} total report${total !== 1 ? "s" : ""}`}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: "4px",
              color: "#FFFFFF",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Place filter chips — single horizontal scrollable row */}
        {places.length > 1 && (
          <div
            style={{
              padding: "10px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexWrap: "nowrap",
              gap: "6px",
              flexShrink: 0,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {[null, ...places].map((place) => {
              const active = selectedPlace === place;
              return (
                <button
                  key={place ?? "__all__"}
                  onClick={() => handlePlaceFilter(place)}
                  style={{
                    padding: "4px 11px",
                    borderRadius: "3px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.12s",
                    background: active ? "rgba(255,152,0,0.20)" : "rgba(255,255,255,0.06)",
                    border: active ? "1px solid rgba(255,152,0,0.50)" : "1px solid rgba(255,255,255,0.12)",
                    color: active ? "#FF9800" : "#C5C5C5",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {place ?? (lang === "ml" ? "എല്ലാ സ്ഥലങ്ങളും" : "All places")}
                </button>
              );
            })}
          </div>
        )}

        {/* Reports list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
              <p style={{ color: "#7D7D7D", fontSize: "13px", margin: 0, fontFamily: lang === "ml" ? mlFont : "inherit" }}>
                {lang === "ml" ? "ലോഡ് ചെയ്യുന്നു…" : "Loading reports…"}
              </p>
            </div>
          ) : reports.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
              <p style={{ color: "#7D7D7D", fontSize: "13px", margin: 0, fontFamily: lang === "ml" ? mlFont : "inherit" }}>
                {lang === "ml" ? "റിപ്പോർട്ടുകൾ ഇല്ല" : "No reports found"}
              </p>
            </div>
          ) : (
            <>
              {reports.map((item) => {
                const label = statusLabel(item.status, lang);
                const color = statusColor(item.status);
                const isHot = item.status !== "NORMAL";
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "11px 20px",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      gap: "12px",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "4px",
                          flexShrink: 0,
                          background: item.status === "EXTREME_HOT"
                            ? "rgba(255,59,48,0.18)"
                            : isHot ? "rgba(255,152,0,0.15)" : "rgba(34,197,94,0.12)",
                          border: `1px solid ${item.status === "EXTREME_HOT"
                            ? "rgba(255,59,48,0.30)"
                            : isHot ? "rgba(255,152,0,0.25)" : "rgba(34,197,94,0.22)"}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                        }}
                      >
                        {isHot ? "🌡️" : "🌿"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#EAEAEA",
                            lineHeight: 1.3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontFamily: lang === "ml" ? mlFont : "inherit",
                          }}
                        >
                          {lang === "ml" ? (
                            <>
                              <span style={{ color: "#FFFFFF" }}>{item.place}</span>
                              <span style={{ color: "rgba(255,255,255,0.60)" }}> ൽ </span>
                              <span style={{ color, fontWeight: 700 }}>{label}</span>
                            </>
                          ) : (
                            <>
                              <span style={{ color, fontWeight: 700 }}>{label}</span>
                              {" reported in "}
                              <span style={{ color: "#FFFFFF" }}>{item.place}</span>
                            </>
                          )}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#7D7D7D" }}>{item.district}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", color: "#7D7D7D", flexShrink: 0 }}>{item.time}</span>
                  </div>
                );
              })}

              {reports.length < total && (
                <div style={{ padding: "16px", textAlign: "center" }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{
                      padding: "8px 24px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "rgba(255,152,0,0.15)",
                      border: "1px solid rgba(255,152,0,0.35)",
                      color: "#FF9800",
                      cursor: loadingMore ? "not-allowed" : "pointer",
                      opacity: loadingMore ? 0.6 : 1,
                      fontFamily: lang === "ml" ? mlFont : "inherit",
                    }}
                  >
                    {loadingMore
                      ? (lang === "ml" ? "ലോഡ്…" : "Loading…")
                      : lang === "ml"
                        ? `കൂടുതൽ കാണൂ (${total - reports.length} ബാക്കി)`
                        : `Load more (${total - reports.length} remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
