export default function CTASection() {
  const benefits = [
    { icon: "💬", title: "Report Conditions", sub: "Share how it feels" },
    { icon: "👥", title: "Help Community", sub: "Keep others informed" },
    { icon: "🛡", title: "Build Awareness", sub: "Create real change" },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #2B180D 0%, #3A2112 50%, #2B180D 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginTop: "48px",
      }}
    >
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "0 48px",
          height: "180px",
          display: "flex",
          alignItems: "center",
          gap: "40px",
        }}
      >
        {/* Illustration */}
        <div
          style={{
            width: "120px",
            height: "120px",
            flexShrink: 0,
            borderRadius: "24px",
            background: "linear-gradient(135deg, rgba(255,138,0,0.20), rgba(255,45,32,0.15))",
            border: "1px solid rgba(255,138,0,0.20)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
          }}
        >
          🌞
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 800, color: "#FFF5E6", letterSpacing: "-0.3px" }}>
            Your Report. Real Impact.
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#9A8B7C" }}>
            Every report helps build a cooler, safer Kerala.
          </p>
          <div style={{ display: "flex", gap: "28px" }}>
            {benefits.map(({ icon, title, sub }) => (
              <div key={title} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </span>
                <div>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#D9C8B6" }}>{title}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#6A5A4B" }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "52px",
              padding: "0 28px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #FF8A00, #FF5A3D)",
              color: "#FFFFFF",
              border: "none",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 700,
              fontFamily: "inherit",
              boxShadow: "0 10px 30px rgba(255,122,0,0.35)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 16px 40px rgba(255,122,0,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(255,122,0,0.35)";
            }}
          >
            Report Now →
          </button>
          <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#6A5A4B" }}>
            It takes less than 30 seconds!
          </p>
        </div>
      </div>
    </div>
  );
}
