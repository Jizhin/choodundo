import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchDistricts } from "../api/client";

export default function StatsStrip() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: fetchStats, refetchInterval: 30_000 });
  const { data: dist } = useQuery({ queryKey: ["districts"], queryFn: fetchDistricts, refetchInterval: 30_000 });

  const total = dist?.total_reports ?? 0;
  const activeDistricts = dist?.districts.filter((d) => d.total > 0).length ?? 0;
  const live2h = stats?.reports_last_2h ?? 0;

  const items = [
    {
      icon: (
        <div style={{ width: "42px", height: "42px", borderRadius: "14px", background: "linear-gradient(135deg, #FF5A3D, #FF2D20)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
          📡
        </div>
      ),
      value: total > 0 ? total.toLocaleString() : "0",
      label: "Total Reports",
      sub: "From across Kerala",
    },
    {
      icon: (
        <div style={{ width: "42px", height: "42px", borderRadius: "14px", background: "linear-gradient(135deg, #FF8A00, #FFC107)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
          🗺
        </div>
      ),
      value: String(activeDistricts),
      label: "Districts Active",
      sub: "Live heat updates",
    },
    {
      icon: (
        <div style={{ width: "42px", height: "42px", borderRadius: "14px", background: "linear-gradient(135deg, #16A34A, #22C55E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
          👥
        </div>
      ),
      value: live2h > 0 ? live2h.toLocaleString() : "0",
      label: "People Reporting",
      sub: "Right now",
    },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #1A0E08 0%, #24140B 50%, #1A0E08 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          padding: "0 48px",
          width: "100%",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "16px",
              padding: "24px 0",
              borderRight: i < items.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              paddingRight: i < items.length - 1 ? "48px" : "0",
              paddingLeft: i > 0 ? "48px" : "0",
            }}
          >
            {item.icon}
            <div>
              <p style={{ margin: 0, fontSize: "28px", fontWeight: 800, lineHeight: 1, color: "#FFF5E6", letterSpacing: "-0.5px" }}>
                {item.value}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: 600, color: "#D9C8B6" }}>
                {item.label}
              </p>
              <p style={{ margin: "1px 0 0", fontSize: "11px", color: "#6A5A4B" }}>
                {item.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
