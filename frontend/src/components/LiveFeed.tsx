import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchFeed } from "../api/client";
import { useStore } from "../store/useStore";
import type { FeedItem } from "../types";

const VISIBLE = 8;

function FeedRow({ item }: { item: FeedItem }) {
  const isHot = item.status === "HOT";
  return (
    <li className="animate-slide-in border-b border-border py-3 last:border-b-0">
      <p className="text-sm leading-snug">
        <span className="mr-1">{isHot ? "🔥" : "🍃"}</span>
        <span className={isHot ? "font-semibold text-hot" : "font-semibold text-normal"}>
          {isHot ? "HOT" : "Comfortable"}
        </span>{" "}
        <span className="text-text-secondary">conditions reported from</span>{" "}
        <span className="font-medium">{item.place}</span>
      </p>
      <p className="mt-0.5 text-xs text-text-secondary">• {item.time}</p>
    </li>
  );
}

export default function LiveFeed() {
  const feed = useStore((s) => s.feed);
  const setFeed = useStore((s) => s.setFeed);
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["feed"],
    queryFn: () => fetchFeed(60),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (data) setFeed(data);
  }, [data, setFeed]);

  const visible = showAll ? feed : feed.slice(0, VISIBLE);

  return (
    <div className="flex h-full flex-col rounded border border-border bg-surface lg:h-[520px]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Live Activity
        </h2>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-live">
          <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-live" />
          LIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-1">
        {isLoading && feed.length === 0 ? (
          <p className="py-12 text-center text-sm text-text-secondary">
            Loading live reports…
          </p>
        ) : feed.length === 0 ? (
          <p className="py-12 text-center text-sm text-text-secondary">
            No reports yet. Be the first to report.
          </p>
        ) : (
          <ul>
            {visible.map((item) => (
              <FeedRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>

      {feed.length > VISIBLE && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="border-t border-border px-5 py-3 text-left text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          {showAll ? "Show less" : "View all activity →"}
        </button>
      )}
    </div>
  );
}
