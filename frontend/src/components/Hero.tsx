import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "../api/client";
import { relativeTime } from "../lib/time";

export default function Hero() {
  const { data } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 30_000,
  });

  const today = data?.reports_today ?? 0;
  const last = data?.last_report_at;

  return (
    <section className="w-full border-b border-border">
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-center gap-1.5 px-6 py-7 text-center">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">🔥 ചൂടുണ്ടോ?</h1>
        <p className="text-sm font-medium text-text-secondary">
          Real-time community heat reports across Kerala
        </p>
        <p className="flex flex-wrap items-center justify-center gap-x-2 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-live rounded-full bg-live" />
            <span className="font-semibold text-text-primary">
              {today.toLocaleString()}
            </span>
            reports today
          </span>
          <span className="text-text-secondary/50">•</span>
          <span>{last ? `Last report ${relativeTime(last)}` : "No reports yet"}</span>
        </p>
      </div>
    </section>
  );
}
