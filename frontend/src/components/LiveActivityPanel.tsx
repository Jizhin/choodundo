import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchFeed } from "../api/client";
import { useStore } from "../store/useStore";
import { useOnlineUsers } from "../hooks/useOnlineUsers";
import type { FeedItem } from "../types";

function getLabelEn(item: FeedItem): string {
  if (item.status === "EXTREME_HOT") return "EXTREME HOT";
  return item.status === "HOT" ? "HOT" : "NOT HOT";
}

function getMlHeatWord(item: FeedItem): string {
  if (item.status === "EXTREME_HOT") return "കടുത്ത ചൂട്";
  if (item.status === "HOT") return "ചൂട്";
  return "ചൂടില്ല";
}

function getLabelColor(item: FeedItem): string {
  if (item.status === "EXTREME_HOT") return "#FF3B30";
  return item.status === "HOT" ? "#FF9800" : "#22C55E";
}

function FeedRow({ item, lang }: { item: FeedItem; lang: "en" | "ml" }) {
  const labelEn = getLabelEn(item);
  const mlHeatWord = getMlHeatWord(item);
  const color = getLabelColor(item);
  const isNormal = item.status === "NORMAL";
  const isHot = item.status === "HOT" || item.status === "EXTREME_HOT";
  const isExtremeHot = item.status === "EXTREME_HOT";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        gap: "10px",
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
            background: isExtremeHot
              ? "rgba(255,59,48,0.18)"
              : isHot
              ? "rgba(255,152,0,0.15)"
              : "rgba(34,197,94,0.12)",
            border: `1px solid ${isExtremeHot ? "rgba(255,59,48,0.30)" : isHot ? "rgba(255,152,0,0.25)" : "rgba(34,197,94,0.22)"}`,
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
              fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit",
            }}
          >
            {lang === "ml" ? (
              <>
                <span style={{ color: "#FFFFFF" }}>{item.place}</span>
                <span style={{ color: "rgba(255,255,255,0.55)" }}>ൽ </span>
                <span style={{ color, fontWeight: 700 }}>{mlHeatWord}</span>
                {!isNormal && (
                  <span style={{ color: "rgba(255,255,255,0.55)" }}> റിപ്പോർട്ട് ചെയ്തു</span>
                )}
              </>
            ) : (
              <>
                <span style={{ color, fontWeight: 700 }}>{labelEn}</span>
                {" reported in "}
                <span style={{ color: "#FFFFFF" }}>{item.place}</span>
              </>
            )}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#7D7D7D" }}>
            {item.district}
          </p>
        </div>
      </div>

      <span style={{ fontSize: "11px", color: "#7D7D7D", flexShrink: 0 }}>{item.time}</span>
    </div>
  );
}

export default function LiveActivityPanel() {
  const feed = useStore((s) => s.feed);
  const mergeFeed = useStore((s) => s.mergeFeed);
  const lang = useStore((s) => s.lang);
  const onlineCount = useOnlineUsers();

  const { data } = useQuery({
    queryKey: ["feed"],
    queryFn: () => fetchFeed(60),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (data) mergeFeed(data);
  }, [data, mergeFeed]);

  const visible = feed.slice(0, 6);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "rgba(8,8,8,0.92)",
        border: "1px solid rgba(255,110,0,0.42)",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span
            className="animate-pulse-live"
            style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#FF3B30", display: "inline-block" }}
          />
          <span style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
            {lang === "ml" ? "തത്സമയ അപ്ഡേറ്റ്" : "LIVE UPDATES"}
          </span>
        </div>
        {onlineCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ADE80", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: "10px", fontWeight: 600, color: "#7D7D7D", fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
              {onlineCount} {lang === "ml" ? "പേർ ഓൺലൈൻ" : "online"}
            </span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {visible.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "24px" }}>
            <p style={{ fontSize: "12px", color: "#7D7D7D", textAlign: "center", margin: 0, fontFamily: lang === "ml" ? '"Noto Sans Malayalam", "Inter", sans-serif' : "inherit" }}>
              {lang === "ml" ? "കേരളത്തിൽ നിന്ന് റിപ്പോർട്ടുകൾ കാത്തിരിക്കുന്നു…" : "Waiting for live reports across Kerala…"}
            </p>
          </div>
        ) : (
          visible.map((item) => <FeedRow key={item.id} item={item} lang={lang} />)
        )}
      </div>
    </div>
  );
}
