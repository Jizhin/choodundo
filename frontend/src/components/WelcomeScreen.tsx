import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";

const SEEN_KEY = "cu_welcome_seen";
const PING_URL = (import.meta.env.VITE_API_BASE_URL ?? "") + "/api/ping";
const WARM_THRESHOLD_MS = 2500; // if no response within this, show warm-up UI
const MAX_WARMUP_S = 50;        // Render cold-start worst case

type ServerState = "checking" | "ready" | "warming";

export default function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const lang = useStore((s) => s.lang);
  const [exiting, setExiting] = useState(false);
  const [serverState, setServerState] = useState<ServerState>("checking");
  const [elapsed, setElapsed] = useState(0);
  const doneRef = useRef(false);

  function dismiss() {
    setExiting(true);
    sessionStorage.setItem(SEEN_KEY, "1");
    setTimeout(onDone, 380);
  }

  // Auto-dismiss keyboard shortcut (Enter / Space)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") dismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Ping the backend to detect cold-start
  useEffect(() => {
    const startTs = Date.now();
    doneRef.current = false;

    const tryPing = async () => {
      try {
        const r = await fetch(PING_URL, { cache: "no-store" });
        if (r.ok && !doneRef.current) {
          doneRef.current = true;
          setServerState("ready");
        }
      } catch {
        // still cold
      }
    };

    tryPing();

    // After threshold with no response, switch to warming UI
    const warmTimer = window.setTimeout(() => {
      if (!doneRef.current) setServerState("warming");
    }, WARM_THRESHOLD_MS);

    // Retry every 3s until ready
    const retryId = window.setInterval(tryPing, 3000);

    // Elapsed counter for progress display
    const tickId = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTs) / 1000));
    }, 1000);

    return () => {
      doneRef.current = true;
      clearTimeout(warmTimer);
      clearInterval(retryId);
      clearInterval(tickId);
    };
  }, []);

  const progressPct = Math.min(100, (elapsed / MAX_WARMUP_S) * 100);

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
          marginBottom: "32px",
        }}
      >
        {[
          {
            icon: "📍",
            en: "See how hot it is in your district right now — from people on the ground.",
            ml: "നിങ്ങളുടെ ജില്ലയിൽ ഇപ്പോൾ എത്ര ചൂടാണെന്ന് അറിയൂ.",
          },
          {
            icon: "🌡️",
            en: "Tap a thermometer to report Extreme Hot, Hot, or Not Hot where you are.",
            ml: "നിങ്ങളുടെ സ്ഥലത്തെ ചൂട് — അതിചൂട്, ചൂടുണ്ട്, ചൂടില്ല — റിപ്പോർട്ട് ചെയ്യൂ.",
          },
          {
            icon: "👁️",
            en: "Live updates from all 14 districts. Community-driven, real-time.",
            ml: "14 ജില്ലകളിൽ നിന്നും തത്സമയ അപ്‌ഡേറ്റുകൾ.",
          },
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
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.5,
                fontFamily:
                  lang === "ml"
                    ? '"Noto Sans Malayalam", "Inter", sans-serif'
                    : "inherit",
              }}
            >
              {lang === "ml" ? card.ml : card.en}
            </p>
          </div>
        ))}
      </div>

      {/* Status legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "32px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          { dot: "#FF3B30", en: "Extreme Hot", ml: "അതിചൂട്" },
          { dot: "#FF9800", en: "Hot",         ml: "ചൂടുണ്ട്" },
          { dot: "#22C55E", en: "Not Hot",     ml: "ചൂടില്ല"  },
        ].map((item) => (
          <div key={item.en} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: item.dot,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.6)",
                fontFamily:
                  lang === "ml"
                    ? '"Noto Sans Malayalam", "Inter", sans-serif'
                    : "inherit",
              }}
            >
              {lang === "ml" ? item.ml : item.en}
            </span>
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button
        onClick={dismiss}
        style={{
          background: "#FF3B30",
          color: "#FFFFFF",
          border: "none",
          borderRadius: "6px",
          padding: "14px 40px",
          fontSize: "15px",
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.03em",
          fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit",
          transition: "background 0.15s ease, transform 0.1s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#E0352B"; e.currentTarget.style.transform = "scale(1.03)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#FF3B30"; e.currentTarget.style.transform = "scale(1)"; }}
      >
        {lang === "ml" ? "ആരംഭിക്കൂ →" : "Get Started →"}
      </button>

      {/* Server status — bottom of screen */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(320px, 90vw)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {serverState === "checking" && (
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#FF3B30",
                display: "inline-block",
                animation: "cu-pulse 1.4s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
              {lang === "ml" ? "കണക്‌റ്റ് ചെയ്യുന്നു…" : "Connecting to server…"}
            </span>
          </div>
        )}

        {serverState === "warming" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#FF9800",
                  display: "inline-block",
                  animation: "cu-pulse 1.4s ease-in-out infinite",
                }}
              />
              <span style={{ fontSize: "11px", color: "rgba(255,152,0,0.8)", letterSpacing: "0.04em" }}>
                {lang === "ml"
                  ? `സെർവർ ഓണാകുന്നു… (${elapsed}s)`
                  : `Server is starting up… (${elapsed}s)`}
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "2px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "1px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "#FF9800",
                  borderRadius: "1px",
                  transition: "width 1s linear",
                }}
              />
            </div>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.18)", textAlign: "center" }}>
              {lang === "ml"
                ? "ഫ്രീ ടയർ സ്ലീപ്പ് മോഡിൽ നിന്ന് ഉണരുന്നു — ~30s കാത്തിരിക്കൂ"
                : "Free tier waking from sleep — usually takes ~30s"}
            </span>
          </>
        )}

        {serverState === "ready" && (
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ fontSize: "11px", color: "#22C55E", letterSpacing: "0.05em" }}>
              {lang === "ml" ? "✓ സെർവർ റെഡി" : "✓ Server ready"}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cu-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}
