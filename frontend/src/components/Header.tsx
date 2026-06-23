import { useQuery } from "@tanstack/react-query";
import { fetchDistricts } from "../api/client";
import { useStore } from "../store/useStore";

export default function Header() {
  const { data: districts } = useQuery({
    queryKey: ["districts"],
    queryFn: fetchDistricts,
    refetchInterval: 30_000,
  });
  const reportCount = districts?.total_reports ?? 0;
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);

  return (
    <header
      style={{
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "rgba(5,5,5,0.96)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "20px" }}>☀️</span>
        <span
          style={{
            fontFamily: '"Noto Sans Malayalam", "Inter", sans-serif',
            fontWeight: 800,
            fontSize: "18px",
            color: "#FFFFFF",
            letterSpacing: "-0.3px",
          }}
        >
          ചൂടുണ്ടോ?
        </span>
      </div>

      {/* Right */}
      <div className="header-inner" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* EN / ML toggle */}
        <div
          style={{
            display: "flex",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          {(["en", "ml"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: "5px 13px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.07em",
                cursor: "pointer",
                border: "none",
                borderRight: l === "en" ? "1px solid rgba(255,255,255,0.18)" : "none",
                background: lang === l ? "rgba(255,255,255,0.18)" : "transparent",
                color: lang === l ? "#FFFFFF" : "#6B6B6B",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {l === "en" ? "EN" : "ML"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span
            className="animate-pulse-live"
            style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF3B30", display: "inline-block" }}
          />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.06em" }}>
            LIVE
          </span>
        </div>
        {reportCount > 0 && (
          <span className="header-count" style={{ fontSize: "13px", color: "#C5C5C5", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
            {reportCount} {lang === "ml" ? "റിപ്പോർട്ടുകൾ" : "total reports"}
          </span>
        )}
      </div>
    </header>
  );
}
