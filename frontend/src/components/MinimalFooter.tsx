export default function MinimalFooter() {
  return (
    <footer
      className="footer-mobile"
      style={{
        height: "80px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "#050505",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "16px" }}>☀️</span>
        <div>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#FFFFFF", fontFamily: '"Noto Sans Malayalam", "Inter", sans-serif' }}>
            ചൂടുണ്ടോ?
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: "#7D7D7D" }}>Community heat reports across Kerala</p>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: "12px", color: "#7D7D7D" }}>
        Made with ❤️ by the Kerala community
      </p>
    </footer>
  );
}
