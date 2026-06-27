import { useEffect } from "react";

const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes — Render spins down after 15
const PING_URL = (import.meta.env.VITE_API_BASE_URL ?? "") + "/api/ping";

/**
 * Keeps the Render free-tier backend warm by pinging /api/ping every 10 minutes.
 * Also re-pings immediately whenever the tab becomes visible again, since the
 * browser may have throttled the interval while the tab was hidden.
 */
export function useKeepAlive() {
  useEffect(() => {
    const ping = () =>
      fetch(PING_URL, { method: "GET", cache: "no-store" }).catch(() => {});

    ping();
    const id = setInterval(ping, PING_INTERVAL);

    const onVisible = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
