import { useEffect, useRef, useState } from "react";

function getCurrentHash(): string | null {
  const scripts = document.querySelectorAll<HTMLScriptElement>("script[src]");
  for (const s of scripts) {
    const m = s.src.match(/\/assets\/index-([^.]+)\.js/);
    if (m) return m[1];
  }
  return null;
}

async function fetchLatestHash(): Promise<string | null> {
  try {
    const res = await fetch("/", { cache: "no-store" });
    const html = await res.text();
    const m = html.match(/\/assets\/index-([^.]+)\.js/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const current = useRef(getCurrentHash());

  useEffect(() => {
    const check = async () => {
      const latest = await fetchLatestHash();
      if (latest && current.current && latest !== current.current) {
        setHasUpdate(true);
      }
    };
    const id = setInterval(check, 3 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return hasUpdate;
}
