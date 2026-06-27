import { useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { useLiveSocket } from "./hooks/useLiveSocket";
import { useKeepAlive } from "./hooks/useKeepAlive";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import DistrictGrid from "./components/DistrictGrid";
import MinimalFooter from "./components/MinimalFooter";
import UpdateBanner from "./components/UpdateBanner";
import WelcomeScreen from "./components/WelcomeScreen";

const SEEN_KEY = "cu_welcome_seen";

export default function App() {
  useLiveSocket();
  useKeepAlive();
  const [showWelcome, setShowWelcome] = useState(() => !sessionStorage.getItem(SEEN_KEY));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #050505 0%, #080808 40%, #0B0B0B 100%)",
        color: "#FFFFFF",
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      {showWelcome && <WelcomeScreen onDone={() => setShowWelcome(false)} />}
      <Header />
      <UpdateBanner />
      <HeroSection />
      <div className="page-side-padding" style={{ padding: "20px 24px 0" }}>
        <DistrictGrid />
      </div>
      <div style={{ marginTop: "24px" }}>
        <MinimalFooter />
      </div>
      <Analytics />
    </div>
  );
}
