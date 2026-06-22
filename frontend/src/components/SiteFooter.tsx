import { Flame } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer
      className="flex items-center justify-between px-8 py-5"
      style={{
        background: "#ffffff",
        borderTop: "1px solid #E7E2D9",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4" style={{ color: "#C97B2A" }} />
        <span className="text-[14px] font-bold" style={{ color: "#1A1A1A" }}>
          ചൂടുണ്ടോ?
        </span>
      </div>

      {/* Center */}
      <p className="text-[13px]" style={{ color: "#888888" }}>
        Community-powered heat reporting across Kerala · No login required · No tracking
      </p>

      {/* Right */}
      <div className="flex items-center gap-6 text-[12px]" style={{ color: "#888888" }}>
        <span className="flex items-center gap-1.5">
          <span>👤</span> No login required
        </span>
        <span className="flex items-center gap-1.5">
          <span>🛡</span> No tracking
        </span>
        <span className="flex items-center gap-1.5">
          <span>⏱</span> Reports expire in 2 hours
        </span>
      </div>
    </footer>
  );
}
