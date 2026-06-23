import { useEffect, useRef, useState } from "react";
import { sendHeartbeat } from "../api/client";

function getSessionId(): string {
  let id = sessionStorage.getItem("choodundo_sid");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    sessionStorage.setItem("choodundo_sid", id);
  }
  return id;
}

export function useOnlineUsers(): number {
  const [count, setCount] = useState(0);
  const sid = useRef(getSessionId());

  useEffect(() => {
    let cancelled = false;

    const ping = async () => {
      try {
        const n = await sendHeartbeat(sid.current);
        if (!cancelled) setCount(n);
      } catch {
        // silently ignore — don't break the UI
      }
    };

    ping();
    const id = setInterval(ping, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return count;
}
