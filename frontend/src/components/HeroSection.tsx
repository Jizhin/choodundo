import { useQuery } from "@tanstack/react-query";
import LiveActivityPanel from "./LiveActivityPanel";
import TopDistrictsPanel from "./TopDistrictsPanel";
import LocationBar from "./LocationBar";
import ReportButtons from "./ReportButtons";
import { fetchDistricts } from "../api/client";
import { useStore } from "../store/useStore";

export default function HeroSection() {
  const { data: districts } = useQuery({
    queryKey: ["districts"],
    queryFn: fetchDistricts,
    refetchInterval: 30_000,
  });
  const reportCount = districts?.total_reports ?? 0;
  const lang = useStore((s) => s.lang);

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* Background image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)" }} />
      {/* Bottom fade — blends hero into page background */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100px", background: "linear-gradient(to bottom, transparent 0%, #050505 100%)", zIndex: 6, pointerEvents: "none" }} />

      {/* Content */}
      <div
        className="hero-grid"
        style={{
          position: "relative",
          zIndex: 10,
          padding: "40px 24px",
          display: "grid",
          gridTemplateColumns: "1.3fr 0.7fr",
          gap: "32px",
          alignItems: "start",
        }}
      >
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Top badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                height: "26px",
                background: "#FF3B30",
                borderRadius: "3px",
                padding: "0 10px",
              }}
            >
              <span
                className="animate-pulse-live"
                style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FFFFFF", display: "inline-block" }}
              />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.08em" }}>
                {lang === "ml" ? "തത്സമയം" : "LIVE NOW"}
              </span>
            </div>
            {reportCount > 0 && (
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.04em" }}>
                {lang === "ml" ? `${reportCount} റിപ്പോർട്ടുകൾ` : `${reportCount} TOTAL REPORTS`}
              </span>
            )}
          </div>

          {/* Heading */}
          <h1
            className="hero-title-text"
            style={{
              margin: "0 0 12px",
              fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : '"Inter", sans-serif',
              fontSize: lang === "ml" ? "64px" : "56px",
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: lang === "ml" ? "-2px" : "-1.5px",
            }}
          >
            {lang === "ml" ? (
              <>
                <span style={{ color: "#FFFFFF", display: "block" }}>ഇന്ന് അവിടെ</span>
                <span style={{ color: "#FF8A00", display: "block", textShadow: "0 0 60px rgba(255,138,0,0.30)" }}>
                  ചൂടാണോ?
                </span>
              </>
            ) : (
              <>
                <span style={{ color: "#FFFFFF", display: "block" }}>Is it hot today</span>
                <span style={{ color: "#FF8A00", display: "block", textShadow: "0 0 60px rgba(255,138,0,0.30)" }}>
                  in your place?
                </span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p
            className="hero-subtitle"
            style={{
              fontSize: "14px",
              fontWeight: 400,
              color: "rgba(255,255,255,0.75)",
              margin: "0 0 24px",
              lineHeight: 1.6,
            }}
          >
            {lang === "ml"
              ? "ഇതൊരു ജനകീയ റിപ്പോർട്ടാണ്! നിങ്ങളുടെ നാട്ടിലെ ചൂട് എത്രത്തോളമുണ്ടെന്ന് മറ്റുള്ളവരെ അറിയിക്കൂ, ഒപ്പം കേരളത്തിലെ മറ്റ് ഭാഗങ്ങളിലെ അവസ്ഥയും മനസ്സിലാക്കൂ!"
              : "It's a community-driven report! Let others know how hot it is in your area and see what the rest of the state is feeling today!"}
          </p>

          {/* Search */}
          <div style={{ marginBottom: "16px" }}>
            <LocationBar />
          </div>

          {/* Report cards */}
          <ReportButtons />
        </div>

        {/* RIGHT — fixed-height containers so layout never shifts with data */}
        <div className="hero-right-panels" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="hero-right-live-wrapper" style={{ height: "360px", flexShrink: 0 }}>
            <LiveActivityPanel />
          </div>
          <div className="hero-right-top-wrapper" style={{ height: "220px", flexShrink: 0, overflow: "hidden" }}>
            <TopDistrictsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
