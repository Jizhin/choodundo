import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchDistricts } from "../api/client";

const RANK_STYLE: Record<number, { label: string; color: string }> = {
  1: { label: "🏆", color: "#F59E0B" },
  2: { label: "02", color: "#B5B5B5" },
  3: { label: "03", color: "#CD7F32" },
  4: { label: "04", color: "#7D7D7D" },
  5: { label: "05", color: "#7D7D7D" },
};

export default function TrendingPlaces() {
  const { data, isLoading } = useQuery({
    queryKey: ["districts"],
    queryFn: fetchDistricts,
    refetchInterval: 30_000,
  });

  // Sort districts by HOT count descending, keep top 5 that have at least 1 HOT report.
  const trending = (data?.districts ?? [])
    .filter((d) => d.hot > 0)
    .sort((a, b) => b.hot - a.hot)
    .slice(0, 5);

  return (
    <div
      className="flex h-full flex-col rounded-[20px] border"
      style={{
        background: "rgba(8,8,8,0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
          🔥 Hottest Districts
        </h2>
        <span className="text-xs" style={{ color: "#7D7D7D" }}>
          last 2 hours
        </span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-secondary">Loading…</p>
          </div>
        ) : trending.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-text-secondary">
              No hot reports yet.
              <br />
              <span className="text-xs" style={{ color: "#7D7D7D" }}>
                Be the first to report!
              </span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {trending.map((district, i) => {
              const rank = i + 1;
              const style = RANK_STYLE[rank] ?? { label: String(rank).padStart(2, "0"), color: "#7D7D7D" };
              const isGold = rank === 1;

              return (
                <motion.div
                  key={district.district}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className="group flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-white/[0.03]"
                  style={{
                    borderBottom:
                      i < trending.length - 1
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "none",
                  }}
                >
                  {/* Rank badge */}
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{
                      background: isGold
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(255,255,255,0.05)",
                      color: style.color,
                      border: isGold
                        ? "1px solid rgba(245,158,11,0.3)"
                        : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {style.label}
                  </div>

                  {/* District name */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate font-semibold"
                      style={{ color: isGold ? "#F5E6C8" : "#FFFFFF" }}
                    >
                      {district.district}
                    </p>
                    {district.normal > 0 && (
                      <p className="mt-0.5 text-xs" style={{ color: "#7D7D7D" }}>
                        {district.normal} comfortable
                      </p>
                    )}
                  </div>

                  {/* HOT count */}
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                      style={{
                        background: isGold
                          ? "rgba(239,68,68,0.25)"
                          : "rgba(239,68,68,0.12)",
                        color: isGold ? "#FCA5A5" : "#EF4444",
                      }}
                    >
                      🔥 {district.hot}
                    </span>
                    <span className="text-[10px]" style={{ color: "#7D7D7D" }}>
                      hot reports
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
