"use client";

import { useEffect, useState, useCallback } from "react";
import {
  generateCableMetrics,
  generateGlobalMetrics,
  type GlobalMetrics,
} from "@/lib/simulation/metrics";

function formatNumber(n: number, decimals: number = 1): string {
  if (n >= 1e9) return (n / 1e9).toFixed(decimals) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(decimals) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(decimals) + "K";
  return n.toFixed(decimals);
}

export function MetricsTicker() {
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);

  const tick = useCallback(() => {
    const cable = generateCableMetrics();
    setMetrics(generateGlobalMetrics(cable));
  }, []);

  useEffect(() => {
    tick();
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [tick]);

  if (!metrics) return null;

  const items = [
    {
      label: "HEILDAR UMFERÐ",
      value: `${metrics.totalThroughputTbps.toFixed(1)} Tbps`,
    },
    {
      label: "PAKKAR/SEK",
      value: formatNumber(metrics.totalPacketsPerSec, 0),
    },
    { label: "IX JAFNINGJAR", value: String(metrics.ixPeers) },
    {
      label: "DNS FYRIRSPURNIR",
      value: `${formatNumber(metrics.dnsQueriesPerSec, 1)}/s`,
    },
    { label: "RIPE MÆLAR", value: String(metrics.ripeProbes) },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none bg-[var(--noc-surface)]/70 backdrop-blur-sm border-t border-[var(--noc-border)]">
      <div className="flex items-center justify-center gap-6 px-4 py-2 overflow-x-auto">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-mono text-[10px] tracking-wider text-[var(--noc-text-dim)]">
              {item.label}:
            </span>
            <span className="font-mono text-xs tabular-nums text-[var(--noc-cyan)] font-bold">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
