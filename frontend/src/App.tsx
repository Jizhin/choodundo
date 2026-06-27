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
import LoadingScreen from "./components/LoadingScreen";

const SEEN_KEY    = "cu_welcome_seen";
const LOADING_KEY = "cu_loading_seen";

type Phase = "welcome" | "loading" | "ready";

function initialPhase(): Phase {
  if (!sessionStorage.getItem(SEEN_KEY))    return "welcome";
  if (!sessionStorage.getItem(LOADING_KEY)) return "loading";
  return "ready";
}

export default function App() {
  useLiveSocket();
  useKeepAlive();
  const [phase, setPhase] = useState<Phase>(initialPhase);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #050505 0%, #080808 40%, #0B0B0B 100%)",
        color: "#FFFFFF",
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      {phase === "welcome" && (
        <WelcomeScreen onDone={() => setPhase("loading")} />
      )}
      {phase === "loading" && (
        <LoadingScreen onDone={() => { sessionStorage.setItem(LOADING_KEY, "1"); setPhase("ready"); }} />
      )}
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
