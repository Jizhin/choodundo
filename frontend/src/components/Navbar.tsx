export default function Navbar() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        height: "64px",
        background: "rgba(20,10,4,0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "0 48px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px", lineHeight: 1 }}>🔥</span>
          <div>
            <p
              style={{
                fontFamily: '"Noto Sans Malayalam", sans-serif',
                fontWeight: 800,
                fontSize: "17px",
                color: "#FFF5E6",
                lineHeight: 1,
                margin: 0,
              }}
            >
              ചൂടുണ്ടോ?
            </p>
            <p style={{ fontSize: "10px", color: "#9A8B7C", margin: "2px 0 0", lineHeight: 1 }}>
              Community heat reports across Kerala
            </p>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              className="animate-pulse-live"
              style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#FF3B30", display: "inline-block" }}
            />
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#D9C8B6" }}>Live</span>
          </div>
          <button
            style={{
              height: "36px",
              padding: "0 18px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #FF8A00, #FF5A3D)",
              color: "#FFFFFF",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(255,122,0,0.35)",
            }}
          >
            Report Now
          </button>
        </div>
      </div>
    </nav>
  );
}
