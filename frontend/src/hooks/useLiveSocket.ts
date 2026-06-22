import { useEffect, useRef } from "react";
import { useStore } from "../store/useStore";
import type { WsEvent } from "../types";

function wsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws/live`;
}

/**
 * Maintains a resilient WebSocket connection to the live stream and pushes
 * incoming events into the global store. Auto-reconnects with backoff.
 */
export function useLiveSocket() {
  const prependFeed = useStore((s) => s.prependFeed);
  const setDistrictPct = useStore((s) => s.setDistrictPct);
  const setWsConnected = useStore((s) => s.setWsConnected);
  const retry = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const closedByUs = useRef(false);

  useEffect(() => {
    closedByUs.current = false;
    let pingTimer: number | undefined;

    const connect = () => {
      const ws = new WebSocket(wsUrl());
      socketRef.current = ws;

      ws.onopen = () => {
        retry.current = 0;
        setWsConnected(true);
        pingTimer = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send("ping");
        }, 25000);
      };

      ws.onmessage = (event) => {
        if (event.data === "pong") return;
        let msg: WsEvent;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        if (msg.type === "NEW_REPORT") {
          prependFeed({
            id: msg.id,
            status: msg.status,
            name: msg.name,
            place: msg.place,
            district: msg.district,
            created_at: msg.created_at,
            time: "Just now",
          });
        } else if (msg.type === "DISTRICT_UPDATE") {
          setDistrictPct(msg.district, msg.hot_percentage);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (pingTimer) window.clearInterval(pingTimer);
        if (closedByUs.current) return;
        retry.current = Math.min(retry.current + 1, 6);
        const delay = Math.min(1000 * 2 ** retry.current, 15000);
        window.setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      closedByUs.current = true;
      if (pingTimer) window.clearInterval(pingTimer);
      socketRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
