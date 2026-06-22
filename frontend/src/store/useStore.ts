import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ActiveLocation, FeedItem } from "../types";

interface AppState {
  location: ActiveLocation | null;
  setLocation: (loc: ActiveLocation | null) => void;

  // Live feed (front of list = newest). Capped to avoid unbounded growth.
  feed: FeedItem[];
  setFeed: (items: FeedItem[]) => void;
  prependFeed: (item: FeedItem) => void;
  mergeFeed: (items: FeedItem[]) => void;

  // District hot percentages, updated live over WS.
  districtPct: Record<string, number>;
  setDistrictPct: (district: string, pct: number) => void;

  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;

  lastVotedAt: number | null;
  setLastVotedAt: (t: number) => void;

  lang: "en" | "ml";
  setLang: (l: "en" | "ml") => void;
}

const FEED_CAP = 100;

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      location: null,
      setLocation: (loc) => set({ location: loc }),

      feed: [],
      setFeed: (items) => set({ feed: items.slice(0, FEED_CAP) }),
      prependFeed: (item) =>
        set((s) => {
          if (s.feed.some((f) => f.id === item.id)) return s;
          return { feed: [item, ...s.feed].slice(0, FEED_CAP) };
        }),
      mergeFeed: (items) =>
        set((s) => {
          const existingIds = new Set(s.feed.map((f) => f.id));
          const newItems = items.filter((i) => !existingIds.has(i.id));
          if (newItems.length === 0) return s;
          return { feed: [...newItems, ...s.feed].slice(0, FEED_CAP) };
        }),

      districtPct: {},
      setDistrictPct: (district, pct) =>
        set((s) => ({ districtPct: { ...s.districtPct, [district]: pct } })),

      wsConnected: false,
      setWsConnected: (v) => set({ wsConnected: v }),

      lastVotedAt: null,
      setLastVotedAt: (t) => set({ lastVotedAt: t }),

      lang: "ml",
      setLang: (l) => set({ lang: l }),
    }),
    {
      name: "choodundo",
      partialize: (s) => ({ location: s.location, lastVotedAt: s.lastVotedAt, lang: s.lang }),
    }
  )
);
