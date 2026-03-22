"use client";

import { useEffect, useState } from "react";
import type { DnsRootLatencySummary } from "@/lib/api/types";

function rttColor(ms: number): string {
  if (ms < 1) return "var(--noc-green)";
  if (ms < 5) return "var(--noc-amber)";
  return "var(--noc-red)";
}

export function DnsRootPanel() {
  const [roots, setRoots] = useState<DnsRootLatencySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const res = await fetch("/api/ripe/dns-roots");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted) {
          setRoots(data);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Villa");
          setLoading(false);
        }
      }
    }

    fetchData();
    const id = setInterval(fetchData, 120000); // 2 min
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const overallAvg =
    roots.length > 0
      ? Math.round(
          (roots.reduce((s, r) => s + r.avgRtt, 0) / roots.length) * 100
        ) / 100
      : 0;

  // Scale bar to max RTT across all servers
  const maxRtt = roots.length > 0 ? Math.max(...roots.map((r) => r.maxRtt), 1) : 1;

  return (
    <div className="bg-[var(--noc-surface)] border border-[var(--noc-border)] rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-mono text-xs tracking-[0.2em] text-[var(--noc-text-dim)] uppercase">
          DNS Rótarþjónar
        </h2>
        {roots.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-[var(--noc-text-dim)]">
              Meðal RTT:
            </span>
            <span
              className="font-mono text-xs font-bold"
              style={{ color: rttColor(overallAvg) }}
            >
              {overallAvg}ms
            </span>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 font-mono text-xs text-[var(--noc-text-dim)]">
          Sæki DNS mælingar...
        </div>
      )}

      {error && (
        <div className="text-center py-8 font-mono text-xs text-[var(--noc-red)]">
          Villa: {error}
        </div>
      )}

      {!loading && !error && roots.length > 0 && (
        <div className="space-y-1.5 overflow-y-auto max-h-[320px]">
          {roots.map((root) => (
            <div
              key={root.rootServer}
              className="flex items-center gap-2"
            >
              {/* Letter badge */}
              <span
                className="font-mono text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded shrink-0"
                style={{
                  backgroundColor: "rgba(0, 240, 255, 0.12)",
                  color: "var(--noc-cyan)",
                }}
              >
                {root.rootServer.toUpperCase()}
              </span>

              {/* Operator */}
              <span className="font-mono text-[10px] text-[var(--noc-text-dim)] w-16 truncate shrink-0">
                {root.operator}
              </span>

              {/* RTT bar */}
              <div className="flex-1 h-3 bg-[var(--noc-bg)] rounded-sm overflow-hidden relative">
                <div
                  className="h-full rounded-sm transition-all duration-500"
                  style={{
                    width: `${Math.min((root.avgRtt / maxRtt) * 100, 100)}%`,
                    backgroundColor: rttColor(root.avgRtt),
                    opacity: 0.7,
                    boxShadow: `0 0 4px ${rttColor(root.avgRtt)}`,
                  }}
                />
              </div>

              {/* RTT value */}
              <span
                className="font-mono text-[10px] font-bold w-16 text-right shrink-0"
                style={{ color: rttColor(root.avgRtt) }}
              >
                {root.avgRtt < 1
                  ? `${(root.avgRtt * 1000).toFixed(0)}µs`
                  : `${root.avgRtt.toFixed(2)}ms`}
              </span>

              {/* Probe count */}
              <span className="font-mono text-[9px] text-[var(--noc-text-dim)] w-6 text-right shrink-0">
                ×{root.probeCount}
              </span>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && roots.length === 0 && (
        <div className="text-center py-8 font-mono text-xs text-[var(--noc-text-dim)]">
          Engar mælingar fundust
        </div>
      )}
    </div>
  );
}
