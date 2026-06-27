import { useEffect, useRef, useState } from "react";
import { fetchDistricts, fetchStats } from "../api/client";
import { useStore } from "../store/useStore";

const SEEN_KEY = "cu_welcome_seen";
const PING_URL  = (import.meta.env.VITE_API_BASE_URL ?? "") + "/api/ping";
const WARM_MS   = 2500;

type ServerState = "checking" | "warming" | "ready";

export default function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const lang = useStore((s) => s.lang);

  const [exiting,     setExiting]     = useState(false);
  const [serverState, setServerState] = useState<ServerState>("checking");
  const [elapsed,     setElapsed]     = useState(0);
  const [progress,    setProgress]    = useState(0);
  const [stepLabel,   setStepLabel]   = useState(lang === "ml" ? "കണക്‌റ്റ് ചെയ്യുന്നു…" : "Connecting…");
  const [loaded,      setLoaded]      = useState(false);

  const serverDoneRef = useRef(false);
  const apiDoneRef    = useRef(false);

  function dismiss() {
    if (!loaded) return;
    setExiting(true);
    sessionStorage.setItem(SEEN_KEY, "1");
    setTimeout(onDone, 380);
  }

  // Keyboard shortcut — only works once loaded
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && loaded) dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loaded]);

  // ── Server warm-up ping ──────────────────────────────────────────────────
  useEffect(() => {
    const start = Date.now();
    serverDoneRef.current = false;

    const tryPing = async () => {
      try {
        const r = await fetch(PING_URL, { cache: "no-store" });
        if (r.ok && !serverDoneRef.current) {
          serverDoneRef.current = true;
          setServerState("ready");
        }
      } catch { /* still cold */ }
    };

    tryPing();
    const warmTimer  = window.setTimeout(() => { if (!serverDoneRef.current) setServerState("warming"); }, WARM_MS);
    const retryId    = window.setInterval(tryPing, 3000);
    const elapsedId  = window.setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);

    return () => {
      serverDoneRef.current = true;
      clearTimeout(warmTimer);
      clearInterval(retryId);
      clearInterval(elapsedId);
    };
  }, []);

  // ── API prefetch + progress ──────────────────────────────────────────────
  useEffect(() => {
    let d = false, s = false;

    const check = () => {
      if (!d || !s || apiDoneRef.current) return;
      apiDoneRef.current = true;
      setProgress(100);
      setStepLabel(lang === "ml" ? "✓ റെഡി!" : "✓ Ready!");
      setLoaded(true);
    };

    setStepLabel(lang === "ml" ? "ജില്ലകൾ ലോഡ് ചെയ്യുന്നു…" : "Loading districts…");

    fetchDistricts()
      .then(() => { d = true; setProgress((p) => Math.max(p, 55)); setStepLabel(lang === "ml" ? "സ്ഥിതിവിവരക്കണക്ക്…" : "Loading stats…"); check(); })
      .catch(() => { d = true; check(); });

    fetchStats()
      .then(() => { s = true; setProgress((p) => Math.max(p, 85)); check(); })
      .catch(() => { s = true; check(); });

    // Smooth fake progress fill — stops at 88 until real data arrives
    const fillId = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 88) return p;
        return p + (p < 40 ? 3.5 : p < 70 ? 1.8 : 0.5) * Math.random();
      });
    }, 280);

    // Hard cap — never block more than 35s
    const capId = window.setTimeout(() => {
      if (apiDoneRef.current) return;
      apiDoneRef.current = true;
      setLoaded(true);
      setProgress(100);
    }, 35000);

    return () => { clearInterval(fillId); clearTimeout(capId); };
  }, []);

  // Derived colours
  const barColor  = loaded ? "#FF3B30" : serverState === "warming" ? "#FF9800" : "rgba(255,255,255,0.35)";
  const dotColor  = serverState === "ready" ? "#22C55E" : serverState === "warming" ? "#FF9800" : "rgba(255,255,255,0.3)";
  const progressPct = Math.min(100, progress);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#050505",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        opacity: exiting ? 0 : 1,
        transform: exiting ? "scale(1.015)" : "scale(1)",
        transition: "opacity 0.38s ease, transform 0.38s ease",
      }}
    >
      {/* Logo + title */}
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div style={{ fontSize: "48px", lineHeight: 1, marginBottom: "12px" }}>🌡️</div>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(32px, 8vw, 52px)",
            fontWeight: 800,
            color: "#FFFFFF",
            fontFamily: '"Noto Sans Malayalam", "Manjari", "Inter", sans-serif',
            lineHeight: 1.1,
          }}
        >
          ചൂടുണ്ടോ?
        </h1>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "14px",
            color: "rgba(255,255,255,0.45)",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Kerala Community Heat Reports
        </p>
      </div>

      {/* Info cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          width: "100%",
          maxWidth: "540px",
          marginBottom: "28px",
        }}
      >
        {[
          { icon: "📍", en: "See how hot it is in your district right now — from people on the ground.", ml: "നിങ്ങളുടെ ജില്ലയിൽ ഇപ്പോൾ എത്ര ചൂടാണെന്ന് അറിയൂ." },
          { icon: "🌡️", en: "Tap a thermometer to report Extreme Hot, Hot, or Not Hot where you are.",  ml: "നിങ്ങളുടെ സ്ഥലത്തെ ചൂട് — അതിചൂട്, ചൂടുണ്ട്, ചൂടില്ല — റിപ്പോർട്ട് ചെയ്യൂ." },
          { icon: "👁️", en: "Live updates from all 14 districts. Community-driven, real-time.",          ml: "14 ജില്ലകളിൽ നിന്നും തത്സമയ അപ്‌ഡേറ്റുകൾ." },
        ].map((card) => (
          <div
            key={card.icon}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: "8px",
              padding: "14px 12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "22px", marginBottom: "8px" }}>{card.icon}</div>
            <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5, fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
              {lang === "ml" ? card.ml : card.en}
            </p>
          </div>
        ))}
      </div>

      {/* Status legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px", flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { dot: "#FF3B30", en: "Extreme Hot", ml: "അതിചൂട്" },
          { dot: "#FF9800", en: "Hot",         ml: "ചൂടുണ്ട്" },
          { dot: "#22C55E", en: "Not Hot",     ml: "ചൂടില്ല"  },
        ].map((item) => (
          <div key={item.en} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.dot, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
              {lang === "ml" ? item.ml : item.en}
            </span>
          </div>
        ))}
      </div>

      {/* CTA button — disabled until data is loaded */}
      <button
        onClick={dismiss}
        disabled={!loaded}
        style={{
          background: loaded ? "#FF3B30" : "rgba(255,255,255,0.07)",
          color: loaded ? "#FFFFFF" : "rgba(255,255,255,0.3)",
          border: loaded ? "none" : "1px solid rgba(255,255,255,0.1)",
          borderRadius: "6px",
          padding: "14px 40px",
          fontSize: "15px",
          fontWeight: 700,
          cursor: loaded ? "pointer" : "not-allowed",
          letterSpacing: "0.03em",
          fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit",
          transition: "background 0.4s ease, color 0.4s ease, border 0.4s ease, transform 0.1s ease, box-shadow 0.4s ease",
          animation: loaded ? "cu-btn-ready 0.6s ease" : "none",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "28px",
        }}
        onMouseEnter={(e) => { if (loaded) { e.currentTarget.style.background = "#E0352B"; e.currentTarget.style.transform = "scale(1.03)"; } }}
        onMouseLeave={(e) => { if (loaded) { e.currentTarget.style.background = "#FF3B30"; e.currentTarget.style.transform = "scale(1)"; } }}
      >
        {!loaded && (
          <span
            style={{
              width: "12px",
              height: "12px",
              border: "2px solid rgba(255,255,255,0.2)",
              borderTopColor: "rgba(255,255,255,0.6)",
              borderRadius: "50%",
              display: "inline-block",
              animation: "cu-spin 0.8s linear infinite",
              flexShrink: 0,
            }}
          />
        )}
        {loaded
          ? (lang === "ml" ? "ആരംഭിക്കൂ →" : "Get Started →")
          : (lang === "ml" ? "ലോഡ് ചെയ്യുന്നു…" : "Loading…")}
      </button>

      {/* Progress + server status */}
      <div style={{ width: "min(360px, 90vw)", display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Step label + percentage */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: dotColor,
                display: "inline-block",
                flexShrink: 0,
                animation: loaded ? "none" : "cu-pulse 1.4s ease-in-out infinite",
                transition: "background 0.4s ease",
              }}
            />
            <span style={{
              fontSize: "11px",
              color: loaded ? "#22C55E" : serverState === "warming" ? "rgba(255,152,0,0.8)" : "rgba(255,255,255,0.3)",
              letterSpacing: "0.04em",
              fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit",
              transition: "color 0.4s ease",
            }}>
              {loaded
                ? stepLabel
                : serverState === "warming"
                  ? (lang === "ml" ? `സെർവർ ഓണാകുന്നു… (${elapsed}s)` : `Server starting… (${elapsed}s)`)
                  : serverState === "ready"
                    ? stepLabel
                    : (lang === "ml" ? "കണക്‌റ്റ് ചെയ്യുന്നു…" : "Connecting…")}
            </span>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 700, color: barColor, fontVariantNumeric: "tabular-nums", transition: "color 0.4s ease" }}>
            {Math.round(progressPct)}%
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: "3px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: barColor,
              borderRadius: "2px",
              transition: "width 0.45s ease, background 0.5s ease",
              boxShadow: loaded ? `0 0 10px ${barColor}66` : "none",
            }}
          />
        </div>

        {/* Extra hint when server is cold */}
        {serverState === "warming" && !loaded && (
          <p style={{ margin: 0, fontSize: "10px", color: "rgba(255,255,255,0.18)", textAlign: "center" }}>
            {lang === "ml" ? "ഫ്രീ ടയർ ഉണരുന്നു — ~30s കാത്തിരിക്കൂ" : "Free tier waking from sleep — usually ~30s"}
          </p>
        )}
      </div>

      <style>{`
        @keyframes cu-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.7); }
        }
        @keyframes cu-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes cu-btn-ready {
          0%   { box-shadow: 0 0 0 0 rgba(255,59,48,0.6); }
          50%  { box-shadow: 0 0 0 12px rgba(255,59,48,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,59,48,0); }
        }
      `}</style>
    </div>
  );
}
