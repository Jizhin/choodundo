import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { fetchDistricts } from "../api/client";
import DistrictInsightsPanel from "./DistrictInsightsPanel";

const DISTRICT_COORDS: Record<string, [number, number]> = {
  Thiruvananthapuram: [8.5241, 76.9366],
  Kollam: [8.8932, 76.6141],
  Pathanamthitta: [9.2648, 76.787],
  Alappuzha: [9.4981, 76.3388],
  Kottayam: [9.5916, 76.5222],
  Idukki: [9.9189, 77.1025],
  Ernakulam: [9.9816, 76.2999],
  Thrissur: [10.5276, 76.2144],
  Palakkad: [10.7867, 76.6548],
  Malappuram: [11.051, 76.0711],
  Kozhikode: [11.2588, 75.7804],
  Wayanad: [11.6854, 76.132],
  Kannur: [11.8745, 75.3704],
  Kasaragod: [12.4996, 74.9869],
};

type FilterMode = "ALL" | "HOT" | "NOT_HOT" | "NO_REPORTS";

function makeMarkerIcon(color: string, count: number, selected: boolean, noData = false) {
  const size = noData ? 28 : Math.min(52, Math.max(34, 30 + Math.floor(count / 2)));
  const border = selected
    ? `border: 3px solid #FFF5E6;`
    : noData
    ? `border: 1.5px solid rgba(255,255,255,0.25);`
    : `border: 2px solid rgba(255,255,255,0.70);`;
  const label = noData ? "" : `${count}`;
  return L.divIcon({
    html: `<div style="
      width:${size}px; height:${size}px;
      border-radius:50%;
      background:${color};
      ${border}
      display:flex; align-items:center; justify-content:center;
      color:${noData ? "rgba(255,255,255,0.45)" : "#fff"};
      font-size:${noData ? "9px" : "11px"};
      font-weight:700;
      font-family:Inter,sans-serif;
      cursor:pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.55);
    ">${label}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 8)],
  });
}

const FILTER_BTNS: { mode: FilterMode; label: string; color: string }[] = [
  { mode: "ALL", label: "All", color: "#FFF5E6" },
  { mode: "HOT", label: "☀ Hot", color: "#FF9800" },
  { mode: "NOT_HOT", label: "🌿 Not Hot", color: "#22C55E" },
  { mode: "NO_REPORTS", label: "○ No Reports", color: "#9A8B7C" },
];

export default function MapSection() {
  const [filter, setFilter] = useState<FilterMode>("ALL");
  const [selected, setSelected] = useState<string>("Kannur");

  const { data } = useQuery({
    queryKey: ["districts"],
    queryFn: fetchDistricts,
    refetchInterval: 30_000,
  });

  const districts = data?.districts ?? [];

  useEffect(() => {
    if (districts.length) {
      const hottest = [...districts].sort((a, b) => b.hot - a.hot)[0];
      if (hottest && hottest.hot > 0) setSelected(hottest.district);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districts.length > 0]);

  const selectedData = districts.find((d) => d.district.toLowerCase() === selected.toLowerCase());

  const visibleMarkers = districts.filter((d) => {
    const coords = DISTRICT_COORDS[d.district];
    if (!coords) return false;
    if (filter === "HOT") return d.hot > d.normal && d.total > 0;
    if (filter === "NOT_HOT") return d.normal >= d.hot && d.total > 0;
    if (filter === "NO_REPORTS") return d.total === 0;
    // ALL: show districts with reports
    return d.total > 0;
  });

  const greyMarkers = (filter === "ALL" || filter === "NO_REPORTS")
    ? districts.filter((d) => DISTRICT_COORDS[d.district] && d.total === 0)
    : [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", height: "700px" }}>
      {/* MAP CARD */}
      <div
        style={{
          background: "#24170F",
          borderRadius: "32px",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        {/* Card header */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #FF8A00, #FF5A3D)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              🔥
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#FFF5E6" }}>Live Heat Map</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#6A5A4B" }}>Real-time heat reports from across Kerala</p>
            </div>
          </div>
          {/* Filters */}
          <div style={{ display: "flex", gap: "6px" }}>
            {FILTER_BTNS.map(({ mode, label, color }) => {
              const active = filter === mode;
              return (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  style={{
                    height: "28px",
                    padding: "0 12px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    fontWeight: 600,
                    border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.10)"}`,
                    background: active ? color : "transparent",
                    color: active ? (mode === "ALL" ? "#1A0E08" : "#FFFFFF") : "#9A8B7C",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <MapContainer
            center={[10.5, 76.5]}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
            zoomControl
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              maxZoom={19}
            />
            {visibleMarkers.map((d) => {
              const isHot = d.hot > d.normal;
              const color = isHot ? "#FF9800" : "#22C55E";
              const isSelected = d.district.toLowerCase() === selected.toLowerCase();
              return (
                <Marker
                  key={d.district}
                  position={DISTRICT_COORDS[d.district]}
                  icon={makeMarkerIcon(color, d.total, isSelected)}
                  eventHandlers={{ click: () => setSelected(d.district) }}
                >
                  <Popup>
                    <div style={{ padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "#FFF5E6" }}>{d.district}</div>
                      <div style={{ color, fontSize: "12px", fontWeight: 600, marginTop: "4px" }}>
                        {isHot ? "🌡️ HOT" : "🌿 COOL"}
                      </div>
                      <div style={{ color: "#9A8B7C", fontSize: "11px", marginTop: "3px" }}>
                        {d.hot} hot · {d.normal} not hot
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {greyMarkers.map((d) => (
              <Marker
                key={`grey-${d.district}`}
                position={DISTRICT_COORDS[d.district]}
                icon={makeMarkerIcon("#3A2510", 0, d.district.toLowerCase() === selected.toLowerCase(), true)}
                eventHandlers={{ click: () => setSelected(d.district) }}
              >
                <Popup>
                  <div style={{ padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#FFF5E6" }}>{d.district}</div>
                    <div style={{ color: "#6A5A4B", fontSize: "11px", marginTop: "4px" }}>No reports yet</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Legend */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 14px",
              background: "rgba(20,10,4,0.85)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              backdropFilter: "blur(10px)",
            }}
          >
            {[
              { color: "#FF3B30", label: "Extreme Hot" },
              { color: "#FF9800", label: "Hot" },
              { color: "#22C55E", label: "Not Hot" },
              { color: "rgba(255,255,255,0.20)", label: "No Reports" },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: color, display: "inline-block", border: "1px solid rgba(255,255,255,0.2)" }} />
                <span style={{ fontSize: "10px", fontWeight: 500, color: "#9A8B7C" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DISTRICT CARD */}
      <div
        style={{
          background: "#24170F",
          borderRadius: "32px",
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <DistrictInsightsPanel district={selected} districtData={selectedData} />
      </div>
    </div>
  );
}
