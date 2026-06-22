import { useStore } from "../store/useStore";
import type { FeedItem } from "../types";

function distinctPlaces(feed: FeedItem[], status: "HOT" | "NORMAL", max = 5): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of feed) {
    if (item.status !== status) continue;
    const key = item.place.toLowerCase();
    if (seen.has(key) || !item.place) continue;
    seen.add(key);
    out.push(item.place);
    if (out.length >= max) break;
  }
  return out;
}

function InsightList({
  title,
  emoji,
  places,
  color,
}: {
  title: string;
  emoji: string;
  places: string[];
  color: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
        {emoji} {title}
      </h3>
      {places.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">No reports yet.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {places.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm font-medium">
              <span className={color}>•</span>
              <span className="text-text-primary">{p}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Insights() {
  const feed = useStore((s) => s.feed);
  const hot = distinctPlaces(feed, "HOT");
  const comfortable = distinctPlaces(feed, "NORMAL");

  return (
    <section className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <InsightList title="Trending Hot Places" emoji="🔥" places={hot} color="text-hot" />
      <InsightList
        title="Recently Comfortable"
        emoji="🍃"
        places={comfortable}
        color="text-normal"
      />
    </section>
  );
}
