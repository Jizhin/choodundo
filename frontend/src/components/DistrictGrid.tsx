import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "../store/useStore";
import { fetchDistricts } from "../api/client";
import type { DistrictSummary, DistrictLevel, FeedItem } from "../types";
import DistrictReportsModal from "./DistrictReportsModal";

/* ── Open-Meteo weather temps ───────────────────────────────── */
const DISTRICT_GEO: Record<string, { lat: number; lon: number }> = {
  Kasaragod:          { lat: 12.4996, lon: 74.9869 },
  Kannur:             { lat: 11.8745, lon: 75.3704 },
  Wayanad:            { lat: 11.6854, lon: 76.1320 },
  Kozhikode:          { lat: 11.2588, lon: 75.7804 },
  Malappuram:         { lat: 11.0510, lon: 76.0711 },
  Palakkad:           { lat: 10.7867, lon: 76.6548 },
  Thrissur:           { lat: 10.5276, lon: 76.2144 },
  Ernakulam:          { lat:  9.9312, lon: 76.2673 },
  Idukki:             { lat:  9.9189, lon: 76.9705 },
  Kottayam:           { lat:  9.5916, lon: 76.5222 },
  Alappuzha:          { lat:  9.4981, lon: 76.3388 },
  Pathanamthitta:     { lat:  9.2648, lon: 76.7870 },
  Kollam:             { lat:  8.8932, lon: 76.6141 },
  Thiruvananthapuram: { lat:  8.5241, lon: 76.9366 },
};

const WX_KEY = "cu_wx_v1";
const WX_TTL = 30 * 60 * 1000;

function wxGet(): Record<string, number> | null {
  try {
    const raw = sessionStorage.getItem(WX_KEY);
    if (!raw) return null;
    const { ts, temps } = JSON.parse(raw) as { ts: number; temps: Record<string, number> };
    return Date.now() - ts < WX_TTL ? temps : null;
  } catch { return null; }
}

function wxSet(temps: Record<string, number>) {
  try { sessionStorage.setItem(WX_KEY, JSON.stringify({ ts: Date.now(), temps })); } catch {}
}

function useWeatherTemps(): Record<string, number> {
  const [temps, setTemps] = useState<Record<string, number>>(() => wxGet() ?? {});
  useEffect(() => {
    if (wxGet()) return;
    Promise.allSettled(
      Object.entries(DISTRICT_GEO).map(async ([name, { lat, lon }]) => {
        const r = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&daily=temperature_2m_max&timezone=Asia%2FKolkata&forecast_days=1`
        );
        const j = await r.json();
        return { name, temp: Math.round(j.daily.temperature_2m_max[0] as number) };
      })
    ).then(results => {
      const t: Record<string, number> = {};
      results.forEach(r => { if (r.status === "fulfilled") t[r.value.name] = r.value.temp; });
      setTemps(t);
      wxSet(t);
    });
  }, []);
  return temps;
}

const ML: Record<string, string> = {
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

type LevelCfg = { label: string; labelMl: string; color: string; badgeBg: string; badgeBdr: string; hoverBdr: string };

const LEVEL_CFG: Record<DistrictLevel, LevelCfg> = {
  RED:    { label: "VERY HOT", labelMl: "അതിചൂട്",  color: "#FF3B30", badgeBg: "rgba(255,59,48,0.18)",  badgeBdr: "rgba(255,59,48,0.32)",  hoverBdr: "rgba(255,59,48,0.55)"  },
  ORANGE: { label: "HOT",      labelMl: "ചൂടുണ്ട്",  color: "#FF9800", badgeBg: "rgba(255,152,0,0.15)",  badgeBdr: "rgba(255,152,0,0.30)",  hoverBdr: "rgba(255,152,0,0.55)"  },
  GRAY:   { label: "NOT HOT",  labelMl: "ചൂടില്ല",   color: "#22C55E", badgeBg: "rgba(34,197,94,0.12)",  badgeBdr: "rgba(34,197,94,0.28)",  hoverBdr: "rgba(34,197,94,0.50)"  },
};

function makeSharpPath(vals: number[], W: number, H: number): string {
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

function getFlipColor(item: FeedItem): string {
  if (item.status === "EXTREME_HOT") return "#FF3B30";
  return item.status === "HOT" ? "#FF9800" : "#22C55E";
}

function getFlipLabel(item: FeedItem, lang: "en" | "ml"): string {
  if (item.status === "EXTREME_HOT") return lang === "ml" ? "അതിചൂട്" : "EXTREME HOT";
  if (item.status === "HOT") return lang === "ml" ? "ചൂടുണ്ട്" : "HOT";
  return lang === "ml" ? "ചൂടില്ല" : "NOT HOT";
}

function LatestReports({ district, feed, latestReport, lang }: { district: string; feed: FeedItem[]; latestReport?: FeedItem | null; lang: "en" | "ml" }) {
  const districtItems = useMemo(
    () => feed.filter((f) => f.district.toLowerCase() === district.toLowerCase()),
    [feed, district]
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (districtItems.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % districtItems.length), 3000);
    return () => clearInterval(id);
  }, [districtItems.length]);

  // Feed store has live submitted reports; fall back to the per-district latest from the API
  const items = districtItems.length > 0 ? districtItems : latestReport ? [latestReport] : [];

  if (items.length === 0) {
    return (
      <p className="blink-yellow" style={{ margin: 0, fontSize: "10px", fontWeight: 600, color: "#F59E0B", lineHeight: "34px", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
        {lang === "ml" ? "ഇതുവരെ ഒന്നുമില്ല" : "No reports yet"}
      </p>
    );
  }

  const item = items[Math.min(idx, items.length - 1)];
  const label = getFlipLabel(item, lang);
  const color = getFlipColor(item);
  const isHot = item.status !== "NORMAL";

  return (
    <div key={idx} className="flip-in" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: "22px", height: "22px", borderRadius: "3px", flexShrink: 0, fontSize: "11px",
        background: item.status === "EXTREME_HOT" ? "rgba(255,59,48,0.15)" : isHot ? "rgba(255,152,0,0.12)" : "rgba(34,197,94,0.10)",
      }}>
        {isHot ? "🌡️" : "🌿"}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
          {lang === "ml" ? (
            <>
              <span style={{ color: "#EAEAEA", fontWeight: 600, fontSize: "9px" }}>{item.place}</span>
              <span style={{ color: "rgba(255,255,255,0.60)", fontSize: "9px" }}> ൽ </span>
              <span style={{ color, fontWeight: 700, fontSize: "9px" }}>{label}</span>
            </>
          ) : (
            <>
              <span style={{ color, fontWeight: 700, fontSize: "9px" }}>{label}</span>
              <span style={{ color: "rgba(255,255,255,0.60)", fontSize: "9px" }}> in </span>
              <span style={{ color: "#EAEAEA", fontWeight: 600, fontSize: "9px" }}>{item.place}</span>
            </>
          )}
        </p>
        <p style={{ margin: 0, fontSize: "8px", color: "#7D7D7D" }}>{item.time}</p>
      </div>
    </div>
  );
}

function DistrictCard({ d, feed, lang, temp, onOpen }: { d: DistrictSummary; feed: FeedItem[]; lang: "en" | "ml"; temp?: number; onOpen: () => void; }) {
  const cfg = LEVEL_CFG[d.level] ?? LEVEL_CFG.GRAY;
  const hasData = d.total > 0;
  const gradId = `g${d.district.replace(/\W/g, '')}`;
  const districtName = lang === "ml" ? (ML[d.district] ?? d.district) : d.district;

  const sparkPath = useMemo(() => {
    if (!hasData) return null;
    const hourly = d.hourly ?? [];
    const maxVal = Math.max(...hourly, 0);
    let vals: number[];
    if (maxVal > 0) {
      // Real 24h activity: normalize to 0–1 range
      vals = hourly.map(v => v / maxVal);
    } else {
      // Has all-time data but no reports in last 24h → flat colored line at pct level
      const lvl = Math.max(0.08, d.hot_percentage / 100);
      vals = Array(10).fill(lvl);
    }
    return makeSharpPath(vals, 100, 28);
  }, [d.district, d.hot_percentage, d.hourly, hasData]);

  const areaPath = sparkPath ? sparkPath + ` L100,28 L0,28 Z` : null;

  return (
    <div
      style={{
        background: "#0A0A0A",
        border: "1px solid rgba(255,255,255,0.38)",
        borderRadius: "4px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.15s ease",
        cursor: "pointer",
        overflow: "hidden",
        minWidth: 0,
      }}
      onClick={onOpen}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = cfg.hoverBdr; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.38)"; }}
    >
      {/* Row 1: name + hot% */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
        <span
          style={{
            fontFamily: '"Manjari", "Noto Sans Malayalam", "Inter", sans-serif',
            fontSize: "14px",
            fontWeight: 700,
            color: "#FFFFFF",
            lineHeight: 1.2,
            flex: 1,
            marginRight: "6px",
          }}
        >
          {districtName}
        </span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
          <span style={{ fontSize: "13px", fontWeight: 800, color: cfg.color, letterSpacing: "-0.3px" }}>
            {d.hot_percentage.toFixed(1)}%
          </span>
          {temp !== undefined && (
            <span style={{ fontSize: "9px", fontWeight: 600, color: "#7D7D7D", marginTop: "1px" }}>
              {temp}°C
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Sparkline or no-data flat line */}
      <div style={{ marginBottom: "4px" }}>
        {hasData && sparkPath ? (
          <svg width="100%" height="28" viewBox="0 0 100 28" preserveAspectRatio="none" style={{ display: "block" }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cfg.color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={cfg.color} stopOpacity="0.01" />
              </linearGradient>
            </defs>
            {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
            <path d={sparkPath} fill="none" stroke={cfg.color} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
          </svg>
        ) : (
          <svg width="100%" height="28" viewBox="0 0 100 28" preserveAspectRatio="none" style={{ display: "block" }}>
            <line x1="0" y1="14" x2="100" y2="14" stroke="rgba(255,255,255,0.38)" strokeWidth="1.5" />
          </svg>
        )}
      </div>

      {/* Row 3: status badge */}
      <div style={{ marginBottom: "5px" }}>
        <span
          style={{
            fontSize: "9px",
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: "2px",
            background: cfg.badgeBg,
            color: cfg.color,
            border: `1px solid ${cfg.badgeBdr}`,
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
            fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit",
          }}
        >
          {lang === "ml" ? cfg.labelMl : cfg.label}
        </span>
      </div>

      {/* Row 4: stats compact row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF3B30", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#FF3B30", lineHeight: 1 }}>{d.extreme_hot}</span>
          <span style={{ fontSize: "8px", color: "#7D7D7D", textTransform: "uppercase" as const }}>EXT</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF9800", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#FF9800", lineHeight: 1 }}>{d.hot}</span>
          <span style={{ fontSize: "8px", color: "#7D7D7D", textTransform: "uppercase" as const }}>HOT</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22C55E", display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#22C55E", lineHeight: 1 }}>{d.normal}</span>
          <span style={{ fontSize: "8px", color: "#7D7D7D", textTransform: "uppercase" as const }}>NOT</span>
        </div>
      </div>

      {/* Temperature grid — stacked cells: EXT red / HOT orange / NORMAL green */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "4px" }}>
        {(() => {
          if (d.total === 0) {
            return Array.from({ length: 10 }, (_, i) => (
              <div key={i} style={{ flex: 1, height: "5px", borderRadius: "1px", background: "rgba(255,255,255,0.07)" }} />
            ));
          }
          const extCells = Math.round((d.extreme_hot / d.total) * 10);
          const hotCells = Math.round((d.hot / d.total) * 10);
          const normalCells = 10 - extCells - hotCells;
          const cells: { color: string }[] = [
            ...Array(extCells).fill({ color: "#FF3B30" }),
            ...Array(hotCells).fill({ color: "#FF9800" }),
            ...Array(Math.max(0, normalCells)).fill({ color: "#22C55E" }),
          ];
          while (cells.length < 10) cells.push({ color: "rgba(255,255,255,0.07)" });
          return cells.slice(0, 10).map((c, i) => (
            <div key={i} style={{ flex: 1, height: "5px", borderRadius: "1px", background: c.color }} />
          ));
        })()}
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", marginBottom: "5px" }} />

      {/* Latest reports */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "9px", fontWeight: 700, color: "#C5C5C5", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
            {lang === "ml" ? "പുതിയ റിപ്പോർട്ടുകൾ" : "LATEST REPORTS"}
          </span>
          <span style={{ fontSize: "12px", color: "#7D7D7D" }}>↻</span>
        </div>
        <div style={{ height: "30px", overflow: "hidden" }}>
          <LatestReports district={d.district} feed={feed} latestReport={d.latest_report} lang={lang} />
        </div>
      </div>
    </div>
  );
}

export default function DistrictGrid() {
  const feed = useStore((s) => s.feed);
  const lang = useStore((s) => s.lang);
  const temps = useWeatherTemps();
  const { data, isLoading } = useQuery({
    queryKey: ["districts"],
    queryFn: fetchDistricts,
    refetchInterval: 30_000,
  });
  const [selected, setSelected] = useState<DistrictSummary | null>(null);

  const districts = data?.districts ?? [];

  const legendItems = [
    { color: "#FF3B30", en: "Extreme Hot", ml: "അതിചൂട്" },
    { color: "#FF9800", en: "Hot",         ml: "ചൂടുണ്ട്" },
    { color: "#22C55E", en: "Not Hot",     ml: "ചൂടില്ല" },
  ];

  return (
    <>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <h2 style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#C5C5C5", textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
            {lang === "ml" ? "എല്ലാ ജില്ലകളും" : "ALL DISTRICTS"}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {legendItems.map(({ color, en, ml }) => (
              <div key={en} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, display: "inline-block" }} />
                <span style={{ fontSize: "11px", color: "#C5C5C5", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
                  {lang === "ml" ? ml : en}
                </span>
              </div>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p style={{ color: "#7D7D7D", fontSize: "13px" }}>Loading districts…</p>
        ) : (
          <div className="district-grid-css" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
            {districts.map((d: DistrictSummary) => (
              <DistrictCard key={d.district} d={d} feed={feed} lang={lang} temp={temps[d.district]} onOpen={() => setSelected(d)} />
            ))}
          </div>
        )}
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
