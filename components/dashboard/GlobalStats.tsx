"use client";

import { useEffect, useState } from "react";
import { generateCableMetrics, generateGlobalMetrics, type GlobalMetrics } from "@/lib/simulation/metrics";

const LABELS = [
  { key: "totalThroughputTbps", label: "HEILDAR UMFERÐ", format: (v: number) => `${v.toFixed(1)} Tbps` },
  { key: "totalPacketsPerSec", label: "PAKKAR/SEK", format: (v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(0)}B` : `${(v / 1e6).toFixed(0)}M` },
  { key: "ixPeers", label: "IX JAFNINGJAR", format: (v: number) => String(v) },
  { key: "dnsQueriesPerSec", label: "DNS FYRIRSPURNIR", format: (v: number) => `${(v / 1000).toFixed(1)}K/s` },
  { key: "ripeProbes", label: "RIPE MÆLAR", format: (v: number) => String(v) },
] as const;

export function GlobalStats() {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);

  useEffect(() => {
    const tick = () => setMetrics(generateGlobalMetrics(generateCableMetrics()));
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  if (!metrics) return null;

  return (
    <div className="px-4">
      <div className="flex items-center justify-center gap-6 px-4 py-3 bg-[var(--noc-surface)] border border-[var(--noc-border)] rounded-lg">
        {LABELS.map(({ key, label, format }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[var(--noc-text-dim)] tracking-wider">
              {label}:
            </span>
            <span className="font-mono text-sm font-bold text-[var(--noc-text)]">
              {format(metrics[key as keyof GlobalMetrics] as number)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
