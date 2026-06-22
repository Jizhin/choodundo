export default function Footer() {
  const quickLinks = ["Live Map", "About Us", "How it works", "FAQ"];
  const resources = ["Heat Safety Tips", "Report Guidelines", "Privacy Policy", "Terms of Service"];

  return (
    <footer
      style={{
        background: "#120A06",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "48px 0 24px",
        marginTop: "0",
      }}
    >
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "0 48px",
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr 1fr 1.5fr",
          gap: "40px",
        }}
      >
        {/* Brand */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "20px" }}>🔥</span>
            <span
              style={{
                fontFamily: '"Noto Sans Malayalam", sans-serif',
                fontWeight: 800,
                fontSize: "16px",
                color: "#FFF5E6",
              }}
            >
              ചൂടുണ്ടോ?
            </span>
          </div>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6A5A4B", lineHeight: 1.6, maxWidth: "240px" }}>
            A community initiative to map how Kerala feels, in real time.
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            {["𝕏", "📷", "▶"].map((icon) => (
              <button
                key={icon}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#9A8B7C",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "inherit",
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p style={{ margin: "0 0 14px", fontSize: "11px", fontWeight: 700, color: "#9A8B7C", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Quick Links
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {quickLinks.map((link) => (
              <button key={link} style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontSize: "13px", color: "#D9C8B6", fontFamily: "inherit" }}>
                {link}
              </button>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div>
          <p style={{ margin: "0 0 14px", fontSize: "11px", fontWeight: 700, color: "#9A8B7C", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Resources
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {resources.map((link) => (
              <button key={link} style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontSize: "13px", color: "#D9C8B6", fontFamily: "inherit" }}>
                {link}
              </button>
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div>
          <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, color: "#9A8B7C", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Stay Updated
          </p>
          <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#6A5A4B" }}>
            Get updates about heat conditions
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{
                flex: 1,
                height: "40px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: "10px",
                padding: "0 14px",
                fontSize: "13px",
                color: "#FFF5E6",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              style={{
                height: "40px",
                padding: "0 16px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #FF8A00, #FF5A3D)",
                color: "#FFFFFF",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: "1600px",
          margin: "32px auto 0",
          padding: "20px 48px 0",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p style={{ margin: 0, fontSize: "12px", color: "#6A5A4B" }}>
          © 2024 ചൂടുണ്ടോ? All rights reserved.
        </p>
        <p style={{ margin: 0, fontSize: "12px", color: "#6A5A4B" }}>
          Made with ❤️ by the Kerala community
        </p>
      </div>
    </footer>
  );
}
