import { useVersionCheck } from "../hooks/useVersionCheck";

export default function UpdateBanner() {
  const hasUpdate = useVersionCheck();

  if (!hasUpdate) return null;

  return (
    <div
      className="update-banner"
      style={{
        position: "fixed",
        top: "84px",
        right: "16px",
        zIndex: 200,
        background: "#1C1C1C",
        border: "1px solid rgba(255,138,0,0.45)",
        borderRadius: "10px",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
        maxWidth: "280px",
        animation: "slideInRight 0.3s ease",
      }}
    >
      <span style={{ fontSize: "18px", flexShrink: 0 }}>🔄</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#FFFFFF" }}>
          Update available
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#888" }}>
          Reload to get the latest
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: "#FF8A00",
          border: "none",
          borderRadius: "6px",
          padding: "7px 13px",
          fontSize: "11px",
          fontWeight: 800,
          color: "#000",
          cursor: "pointer",
          flexShrink: 0,
          letterSpacing: "0.04em",
        }}
      >
        Reload
      </button>
    </div>
  );
}
