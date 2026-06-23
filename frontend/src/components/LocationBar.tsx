import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, LocateFixed } from "lucide-react";
import { detectLocation, searchPlaces } from "../api/client";
import { useStore } from "../store/useStore";
import type { PlaceSearchResult } from "../types";

export default function LocationBar() {
  const location = useStore((s) => s.location);
  const setLocation = useStore((s) => s.setLocation);
  const lang = useStore((s) => s.lang);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);
  const reqIdRef = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); setSearching(false); return; }
    setSearching(true);
    setError(null);
    debounceRef.current = window.setTimeout(async () => {
      const myReq = ++reqIdRef.current;
      try {
        const res = await searchPlaces(q);
        if (myReq !== reqIdRef.current) return;
        setResults(res);
        setOpen(true);
        setHighlight(-1);
        if (res.length === 0) setError("No Kerala places found.");
      } catch {
        if (myReq === reqIdRef.current) setError("Search failed. Try again.");
      } finally {
        if (myReq === reqIdRef.current) setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const detect = () => {
    setError(null);
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await detectLocation(pos.coords.latitude, pos.coords.longitude);
          setLocation({ place_name: loc.place_name, district: loc.district, pincode: loc.pincode, latitude: loc.latitude, longitude: loc.longitude });
          setQuery(""); setResults([]); setOpen(false);
        } catch { setError("Couldn't resolve location."); }
        finally { setDetecting(false); }
      },
      () => { setError("Permission denied. Search instead."); setDetecting(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const pick = (r: PlaceSearchResult) => {
    setLocation({ place_name: r.place_name, district: r.district, pincode: r.pincode, latitude: r.latitude, longitude: r.longitude });
    setOpen(false); setResults([]); setQuery(""); setError(null);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => (h + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h - 1 + results.length) % results.length); }
    else if (e.key === "Enter") { e.preventDefault(); pick(results[highlight >= 0 ? highlight : 0]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Location row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <MapPin size={13} style={{ color: "#FF9800", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#D9C8B6" }}>
            {location ? `${location.place_name}, ${location.district}` : (lang === "ml" ? "ലൊക്കേഷൻ തിരഞ്ഞെടുത്തിട്ടില്ല" : "No location selected")}
          </span>
        </div>
        <button
          onClick={detect}
          disabled={detecting}
          style={{
            display: "flex", alignItems: "center", gap: "4px",
            background: "none", border: "none", cursor: detecting ? "wait" : "pointer",
            fontSize: "12px", fontWeight: 600, color: "#FF9800", padding: 0,
            fontFamily: "inherit", opacity: detecting ? 0.6 : 1,
          }}
        >
          {detecting ? <Loader2 size={12} className="animate-spin" /> : <LocateFixed size={12} />}
          <span className="location-detect-text">
            {lang === "ml" ? "എന്റെ ലൊക്കേഷൻ ഉപയോഗിക്കൂ" : "Use my current location"}
          </span>
        </button>
      </div>

      {/* Search box */}
      <div ref={boxRef} style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", zIndex: 1 }}>
          {searching
            ? <Loader2 size={18} style={{ color: "#9A8B7C" }} className="animate-spin" />
            : <Search size={18} style={{ color: "#9A8B7C" }} />}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={(e) => {
            if (results.length) setOpen(true);
            e.currentTarget.style.borderColor = "rgba(255,152,0,0.60)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255,152,0,0.15), 0 8px 32px rgba(0,0,0,0.35)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)";
          }}
          placeholder={lang === "ml" ? "നിങ്ങളുടെ ലൊക്കേഷൻ തിരയുക" : "Search your location..."}
          autoComplete="off"
          style={{
            width: "100%",
            height: "72px",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(30px)",
            WebkitBackdropFilter: "blur(30px)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "6px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            paddingLeft: "52px",
            paddingRight: "56px",
            fontSize: "16px",
            fontWeight: 500,
            color: "#FFF5E6",
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        />

        <button
          onClick={detect}
          disabled={detecting}
          style={{
            position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
            width: "40px", height: "40px", borderRadius: "14px",
            background: "linear-gradient(135deg, #FF8A00, #FF5A3D)",
            border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#FFFFFF", opacity: detecting ? 0.5 : 1,
            boxShadow: "0 4px 12px rgba(255,122,0,0.35)",
          }}
          title="Use my location"
        >
          {detecting ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </button>

        {/* Dropdown */}
        {open && results.length > 0 && (
          <ul
            style={{
              position: "absolute", zIndex: 9999,
              top: "calc(100% + 8px)", left: 0, right: 0,
              maxHeight: "260px", overflowY: "auto",
              background: "#24170F",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "6px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.60)",
              listStyle: "none", padding: "8px", margin: 0,
            }}
          >
            {results.map((r, i) => (
              <li key={`${r.place_name}-${r.district}-${i}`}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(r)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    width: "100%", padding: "10px 12px", textAlign: "left",
                    background: i === highlight ? "#342015" : "transparent",
                    borderRadius: "4px", border: "none", cursor: "pointer", fontFamily: "inherit",
                    transition: "background 0.12s",
                  }}
                >
                  <MapPin size={13} style={{ color: "#FF9800", flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#FFF5E6", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.place_name}
                  </span>
                  <span style={{ fontSize: "11px", color: "#9A8B7C", flexShrink: 0 }}>
                    {r.district}{r.pincode ? ` · ${r.pincode}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p style={{ fontSize: "11px", color: "#FF6B4A", margin: 0 }}>{error}</p>}
    </div>
  );
}
