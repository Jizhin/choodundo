import { useQuery } from "@tanstack/react-query";
import { fetchDistricts } from "../api/client";
import type { DistrictSummary } from "../types";

const REGIONS: Record<string, string[]> = {
  northern: ["Kasaragod", "Kannur", "Wayanad", "Kozhikode", "Malappuram"],
  central: ["Palakkad", "Thrissur", "Ernakulam", "Idukki", "Kottayam"],
  southern: ["Alappuzha", "Pathanamthitta", "Kollam", "Thiruvananthapuram"],
};

function describe(districts: DistrictSummary[]): { emoji: string; line: string } {
  const total = districts.reduce((a, d) => a + d.total, 0);
  if (total === 0) return { emoji: "🍃", line: "It's calm across Kerala right now" };

  const totalHot = districts.reduce((a, d) => a + d.hot, 0);
  const totalNormal = districts.reduce((a, d) => a + d.normal, 0);

  if (totalHot <= totalNormal) {
    return { emoji: "🍃", line: "Most of Kerala feels comfortable right now" };
  }

  // Hot dominates — find the region with the most hot reports.
  let topRegion = "northern";
  let topHot = -1;
  for (const [region, names] of Object.entries(REGIONS)) {
    const hot = districts
      .filter((d) => names.includes(d.district))
      .reduce((a, d) => a + d.hot, 0);
    if (hot > topHot) {
      topHot = hot;
      topRegion = region;
    }
  }
  return { emoji: "🔥", line: `Hot reports dominate across ${topRegion} Kerala` };
}

export default function KeralaNow() {
  const { data } = useQuery({
    queryKey: ["districts"],
    queryFn: fetchDistricts,
    refetchInterval: 30_000,
  });

  const districts = data?.districts ?? [];
  const total = data?.total_reports ?? 0;
  const { emoji, line } = describe(districts);

  return (
    <section className="w-full rounded border border-border bg-surface px-6 py-12 text-center">
      <h2 className="text-2xl font-bold md:text-3xl">{emoji} Kerala Right Now</h2>
      <p className="mt-3 text-base text-text-secondary md:text-lg">{line}</p>
      <p className="mt-4 text-sm text-text-secondary">
        {total.toLocaleString()} reports in the last 2 hours
      </p>
    </section>
  );
}
