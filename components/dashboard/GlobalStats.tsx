"use client";

import { useEffect, useState, useRef } from "react";
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
  const realPeers = useRef<number | null>(null);
  const realProbes = useRef<number | null>(null);

  // Fetch real counts once, refresh every 5 min
  useEffect(() => {
    async function fetchRealCounts() {
      try {
        const [rixRes, probeRes] = await Promise.all([
          fetch("/api/peeringdb/rix"),
          fetch("/api/ripe/probes"),
        ]);
        if (rixRes.ok) {
          const rix = await rixRes.json();
          realPeers.current = rix.uniqueAsnCount ?? null;
        }
        if (probeRes.ok) {
          const probes = await probeRes.json();
          realProbes.current = Array.isArray(probes) ? probes.length : null;
        }
      } catch {
        // Keep existing values on error
      }
    }
    fetchRealCounts();
    const id = setInterval(fetchRealCounts, 300000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const tick = () => {
      const m = generateGlobalMetrics(generateCableMetrics());
      if (realPeers.current !== null) m.ixPeers = realPeers.current;
      if (realProbes.current !== null) m.ripeProbes = realProbes.current;
      setMetrics(m);
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  if (!metrics) return null;

  return (
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
  );
}
