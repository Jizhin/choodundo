import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { submitReport } from "../api/client";
import { useStore } from "../store/useStore";
import type { ReportStatus } from "../types";

const COOLDOWN_MS = 5 * 60 * 1000;

interface CardDef {
  icon: string;
  en: { label: string; sub: string };
  ml: { label: string; sub: string };
  status: ReportStatus;
  gradient: string;
  shadow: string;
}

const CARDS: CardDef[] = [
  {
    icon: "🌡️",
    en: { label: "EXTREME HOT", sub: "Very difficult to stay outside" },
    ml: { label: "അതിചൂട്", sub: "പുറത്ത് നിൽക്കാൻ ബുദ്ധിമുട്ട്" },
    status: "EXTREME_HOT",
    gradient: "linear-gradient(135deg, #8B0000 0%, #CC2200 100%)",
    shadow: "0 8px 24px rgba(180,0,0,0.35)",
  },
  {
    icon: "☀️",
    en: { label: "HOT", sub: "Uncomfortable and sweaty" },
    ml: { label: "ചൂടുണ്ട്", sub: "ചൂടേറ്റ് വിയർക്കുന്നു" },
    status: "HOT",
    gradient: "linear-gradient(135deg, #7A3800 0%, #CC6600 100%)",
    shadow: "0 8px 24px rgba(180,100,0,0.35)",
  },
  {
    icon: "🌿",
    en: { label: "NOT HOT", sub: "Comfortable and normal" },
    ml: { label: "ചൂടില്ല", sub: "സ്ഥിതി സാധാരണം" },
    status: "NORMAL",
    gradient: "linear-gradient(135deg, #054520 0%, #0A7A3A 100%)",
    shadow: "0 8px 24px rgba(10,120,58,0.30)",
  },
];

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ReportButtons() {
  const location = useStore((s) => s.location);
  const lastVotedAt = useStore((s) => s.lastVotedAt);
  const setLastVotedAt = useStore((s) => s.setLastVotedAt);
  const prependFeed = useStore((s) => s.prependFeed);
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [now, setNow] = useState(() => Date.now());
  const lang = useStore((s) => s.lang);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = lastVotedAt ? Math.max(0, COOLDOWN_MS - (now - lastVotedAt)) : 0;
  const inCooldown = remaining > 0;

  const mutation = useMutation({
    mutationFn: ({ status }: { status: ReportStatus }) => {
      if (!location) throw new Error("no-location");
      return submitReport(status, location);
    },
    onSuccess: (res) => {
      if (res.accepted && res.report) {
        setLastVotedAt(Date.now());
        prependFeed({ ...res.report, time: "Just now" });
        setToastType("success");
        setToast(lang === "en" ? "✓ Report submitted! Thank you." : "✓ റിപ്പോർട്ട് ലഭിച്ചു. നന്ദി!");
      } else {
        setToastType("error");
        setToast(lang === "en" ? "⏱ Already reported recently — try again in 5 min" : "⏱ ഇപ്പോൾ റിപ്പോർട്ട് ചെയ്തു — 5 മിനിറ്റ് കഴിഞ്ഞ് ശ്രമിക്കൂ");
      }
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["districts"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      window.setTimeout(() => setToast(null), 3500);
    },
    onError: () => {
      setToastType("error");
      setToast(lang === "en" ? "Could not submit. Check your connection." : "സമർപ്പിക്കാൻ കഴിഞ്ഞില്ല. ശ്രമിക്കൂ.");
      window.setTimeout(() => setToast(null), 3000);
    },
  });

  const handleClick = (card: CardDef) => {
    if (!location) {
      setToastType("error");
      setToast(lang === "en" ? "Search or detect your location above first" : "ആദ്യം ലൊക്കേഷൻ തിരഞ്ഞെടുക്കൂ");
      window.setTimeout(() => setToast(null), 3000);
      return;
    }
    if (inCooldown) {
      setToastType("error");
      setToast(`⏱ ${lang === "en" ? "Already reported — try again in" : "ഇതിനകം റിപ്പോർട്ട് ചെയ്തു —"} ${formatCountdown(remaining)}`);
      window.setTimeout(() => setToast(null), 3000);
      return;
    }
    mutation.mutate({ status: card.status });
  };

  const isSubmitting = mutation.isPending;
  const reportNowText = lang === "en" ? "Report Now →" : "ഇപ്പോൾ അറിയിക്കൂ →";
  const submittingText = lang === "en" ? "Submitting…" : "അയക്കുന്നു…";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Report cards */}
      <div className="report-cards-row" style={{ display: "flex", gap: "12px" }}>
        {CARDS.map((card) => {
          const text = lang === "en" ? card.en : card.ml;
          return (
            <button
              key={card.status}
              onClick={() => handleClick(card)}
              disabled={isSubmitting || inCooldown}
              style={{
                flex: 1,
                height: "140px",
                borderRadius: "4px",
                background: card.gradient,
                color: "#FFFFFF",
                border: inCooldown ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.12)",
                cursor: isSubmitting || inCooldown ? "not-allowed" : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "16px",
                boxShadow: isSubmitting || inCooldown ? "none" : card.shadow,
                transition: "transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease",
                opacity: isSubmitting ? 0.5 : inCooldown ? 0.60 : 1,
                fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : '"Inter", sans-serif',
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && !inCooldown) e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ fontSize: "28px", lineHeight: 1 }}>{card.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: lang === "ml" ? "14px" : "16px", fontWeight: 700, lineHeight: 1.2 }}>{text.label}</p>
                <p style={{ margin: "3px 0 0", fontSize: lang === "ml" ? "10px" : "11px", opacity: 0.80, lineHeight: 1.3 }}>{text.sub}</p>
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.85 }}>
                {isSubmitting ? submittingText : reportNowText}
              </div>
            </button>
          );
        })}
      </div>

      {/* Cooldown banner */}
      {inCooldown && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "9px 12px",
            background: "rgba(245,158,11,0.10)",
            border: "1px solid rgba(245,158,11,0.28)",
            borderRadius: "4px",
          }}
        >
          <span style={{ fontSize: "14px", flexShrink: 0 }}>⏱</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#F59E0B", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", sans-serif' : "inherit" }}>
            {lang === "en"
              ? `Already reported — next report available in ${formatCountdown(remaining)}`
              : `ഇതിനകം റിപ്പോർട്ട് ചെയ്തു — ${formatCountdown(remaining)} കഴിഞ്ഞ് ശ്രമിക്കൂ`}
          </span>
        </div>
      )}

      {/* Toast / status line */}
      <div style={{ minHeight: "16px" }}>
        {toast ? (
          <p style={{ fontSize: "12px", fontWeight: 600, color: toastType === "success" ? "#4ADE80" : "#FF6B4A", margin: 0 }}>
            {toast}
          </p>
        ) : !location ? (
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", margin: 0, fontFamily: lang === "ml" ? '"Noto Sans Malayalam", sans-serif' : "inherit" }}>
            {lang === "en" ? "Search or detect your location above to enable reporting" : "ലൊക്കേഷൻ കണ്ടെത്തൂ — റിപ്പോർട്ട് ചെയ്യാൻ"}
          </p>
        ) : !inCooldown ? (
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", margin: 0 }}>
            {lang === "en" ? "Anonymous · expires in 2h · anti-spam protected" : "അജ്ഞാതം · 2 മണിക്കൂർ · സ്പാം സംരക്ഷിതം"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
