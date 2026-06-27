import { useEffect, useRef, useState } from "react";
import { fetchDistricts, fetchStats } from "../api/client";
import { useStore } from "../store/useStore";

const MIN_SHOW_MS = 2200;

const MESSAGES: { en: string; ml: string }[] = [
  { en: "14 districts. One heat map.",                              ml: "14 ജില്ലകൾ. ഒരു ഹീറ്റ് മാപ്." },
  { en: "Real reports from real people across Kerala.",             ml: "കേരളത്തിലുടനീളം ജനകീയ റിപ്പോർട്ടുകൾ." },
  { en: "Know how hot it is before you step out.",                  ml: "പുറത്തിറങ്ങുന്നതിനു മുമ്പ് ചൂട് അറിയൂ." },
  { en: "Community-powered. Always real-time.",                     ml: "ജനകീയ ശക്തി. എപ്പോഴും തത്സമയം." },
  { en: "Your report helps your neighbours stay safe.",             ml: "നിങ്ങളുടെ റിപ്പോർട്ട് അയൽക്കാരെ സഹായിക്കും." },
  { en: "Together, we track the heat across Kerala.",               ml: "ഒരുമിച്ച്, നാം ചൂട് ട്രാക്ക് ചെയ്യുന്നു." },
  { en: "Reports update live — no refresh needed.",                 ml: "റിപ്പോർട്ടുകൾ തത്സമയം അപ്‌ഡേറ്റ് ആകും." },
  { en: "Ground truth from every corner of Kerala.",                ml: "കേരളത്തിന്റെ ഓരോ മൂലയിൽ നിന്നും." },
];

const TICKER_ITEMS = [
  "🌡️ Palakkad records Kerala's highest summer temperatures",
  "📍 14 districts covered — Kasaragod to Thiruvananthapuram",
  "👥 Reports decay after 2 hours to stay fresh",
  "🔴 Extreme Hot  ·  🟠 Hot  ·  🟢 Not Hot",
  "📡 Live WebSocket feed — updates without refreshing",
  "🌊 Coastal districts show different heat patterns than inland",
  "⏰ Submit a report in under 5 seconds",
  "🏘️ Neighbourhood-level data, district-level view",
];

// Duplicate for seamless loop
const TICKER = [...TICKER_ITEMS, ...TICKER_ITEMS];

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const lang = useStore((s) => s.lang);

  const [msgIdx, setMsgIdx] = useState(0);
  const [msgIn, setMsgIn] = useState(true);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState(lang === "ml" ? "ഡേറ്റ ലോഡ് ചെയ്യുന്നു…" : "Connecting…");
  const [exiting, setExiting] = useState(false);

  const doneRef = useRef(false);
  const startRef = useRef(Date.now());

  // Cycle motivational messages with slide animation
  useEffect(() => {
    const id = setInterval(() => {
      setMsgIn(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % MESSAGES.length);
        setMsgIn(true);
      }, 350);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Smooth fake progress fill (stops at 88 until real data arrives)
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 88) return p;
        const step = p < 40 ? 4 : p < 70 ? 2 : 0.6;
        return Math.min(88, p + step * Math.random());
      });
    }, 250);
    return () => clearInterval(id);
  }, []);

  // Fetch real data
  useEffect(() => {
    let d = false;
    let s = false;

    const finish = () => {
      if (!d || !s || doneRef.current) return;
      const elapsed = Date.now() - startRef.current;
      const wait = Math.max(0, MIN_SHOW_MS - elapsed);
      setTimeout(() => {
        if (doneRef.current) return;
        doneRef.current = true;
        setProgress(100);
        setStepLabel(lang === "ml" ? "✓ റെഡി!" : "✓ All set!");
        setTimeout(() => {
          setExiting(true);
          setTimeout(onDone, 500);
        }, 600);
      }, wait);
    };

    setStepLabel(lang === "ml" ? "ജില്ലകൾ ലോഡ് ചെയ്യുന്നു…" : "Loading districts…");
    fetchDistricts()
      .then(() => { d = true; setProgress((p) => Math.max(p, 55)); setStepLabel(lang === "ml" ? "സ്ഥിതിവിവരക്കണക്ക്…" : "Loading stats…"); finish(); })
      .catch(() => { d = true; finish(); });

    fetchStats()
      .then(() => { s = true; setProgress((p) => Math.max(p, 80)); finish(); })
      .catch(() => { s = true; finish(); });

    // Hard cap — never block more than 35s
    const cap = setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      setExiting(true);
      setTimeout(onDone, 500);
    }, 35000);

    return () => clearTimeout(cap);
  }, []);

  const msg = MESSAGES[msgIdx];

  // Thermometer fill: progress maps 0→100 to tube fill 0→62px (top of tube is y=12, bottom before bulb is y=74)
  const tubeFill = Math.round((Math.min(progress, 100) / 100) * 62);
  const tubeColor = progress < 45 ? "#22C55E" : progress < 75 ? "#FF9800" : "#FF3B30";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "#050505",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: exiting ? 0 : 1,
        transition: "opacity 0.5s ease",
      }}
    >
      {/* Ambient heat glow — two pulsing rings behind thermometer */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ width: "180px", height: "180px", borderRadius: "50%", border: `1px solid ${tubeColor}`, opacity: 0.12, animation: "cu-ring 2.8s ease-out infinite" }} />
        <div style={{ position: "absolute", width: "180px", height: "180px", borderRadius: "50%", border: `1px solid ${tubeColor}`, opacity: 0.12, animation: "cu-ring 2.8s ease-out infinite 1.4s" }} />
      </div>

      {/* Thermometer SVG */}
      <div style={{ position: "relative", marginBottom: "28px" }}>
        <svg width="44" height="120" viewBox="0 0 44 120" fill="none">
          {/* Glass tube outline */}
          <rect x="16" y="10" width="12" height="68" rx="6" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
          {/* Mercury fill — grows from bottom of tube upward */}
          {tubeFill > 0 && (
            <rect
              x="18"
              y={74 - tubeFill}
              width="8"
              height={tubeFill}
              rx="2"
              fill={tubeColor}
              style={{ transition: "height 0.4s ease, y 0.4s ease, fill 0.6s ease" }}
            />
          )}
          {/* Tick marks */}
          {[20, 35, 50, 65].map((y) => (
            <line key={y} x1="28" y1={y} x2="33" y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          ))}
          {/* Bulb outer */}
          <circle cx="22" cy="92" r="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
          {/* Bulb fill — always filled, shows color */}
          <circle cx="22" cy="92" r="11" fill={tubeColor} style={{ transition: "fill 0.6s ease" }} />
          {/* Glass sheen on bulb */}
          <circle cx="18" cy="88" r="3" fill="rgba(255,255,255,0.15)" />
        </svg>
      </div>

      {/* App title */}
      <h1
        style={{
          margin: "0 0 6px",
          fontSize: "clamp(28px, 7vw, 44px)",
          fontWeight: 800,
          color: "#FFFFFF",
          fontFamily: '"Noto Sans Malayalam", "Manjari", "Inter", sans-serif',
          letterSpacing: "-0.5px",
          lineHeight: 1,
        }}
      >
        ചൂടുണ്ടോ?
      </h1>
      <p style={{ margin: "0 0 36px", fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Kerala Community Heat Reports
      </p>

      {/* Cycling motivational message */}
      <div style={{ height: "48px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", width: "min(480px, 88vw)", marginBottom: "40px", textAlign: "center" }}>
        <p
          style={{
            margin: 0,
            fontSize: "clamp(13px, 3.5vw, 16px)",
            fontWeight: 500,
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.45,
            fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit",
            opacity: msgIn ? 1 : 0,
            transform: msgIn ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.35s ease, transform 0.35s ease",
          }}
        >
          {lang === "ml" ? msg.ml : msg.en}
        </p>
      </div>

      {/* Scrolling facts ticker */}
      <div
        style={{
          width: "100%",
          overflow: "hidden",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "10px 0",
          marginBottom: "40px",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "56px",
            whiteSpace: "nowrap",
            animation: "cu-ticker 28s linear infinite",
            willChange: "transform",
          }}
        >
          {TICKER.map((fact, i) => (
            <span
              key={i}
              style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.38)",
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              {fact}
            </span>
          ))}
        </div>
      </div>

      {/* Progress section */}
      <div style={{ width: "min(340px, 84vw)", display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Step label + percentage */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
            {stepLabel}
          </span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: tubeColor, fontVariantNumeric: "tabular-nums" }}>
            {Math.round(progress)}%
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${tubeColor}99, ${tubeColor})`,
              borderRadius: "2px",
              transition: "width 0.4s ease, background 0.6s ease",
              boxShadow: `0 0 8px ${tubeColor}55`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes cu-ring {
          0%   { transform: scale(0.7); opacity: 0.18; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes cu-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
