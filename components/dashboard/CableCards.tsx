"use client";

import { useEffect, useState, useRef } from "react";
import { cables } from "@/lib/data/cables";
import { generateCableMetrics, type CableMetrics } from "@/lib/simulation/metrics";
import { Sparkline } from "@/components/ui/Sparkline";

export function CableCards() {
  const [metrics, setMetrics] = useState<CableMetrics[]>([]);
  const historyRef = useRef<Record<string, number[]>>({});

  useEffect(() => {
    const tick = () => {
      const m = generateCableMetrics();
      setMetrics(m);
      for (const cm of m) {
        if (!historyRef.current[cm.cableId]) historyRef.current[cm.cableId] = [];
        const h = historyRef.current[cm.cableId];
        h.push(cm.throughputTbps);
        if (h.length > 30) h.shift();
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cables.map((cable) => {
        const cm = metrics.find((m) => m.cableId === cable.id);
        const history = historyRef.current[cable.id] || [];
        const throughput = cm?.throughputTbps ?? 0;
        const utilization = cm?.utilization ?? 0;
        const latency = cm?.latencyMs ?? 0;

        const formatThroughput = (t: number) =>
          t >= 1 ? `${t.toFixed(1)} Tbps` : `${Math.round(t * 1000)} Gbps`;

        return (
          <div
            key={cable.id}
            className="bg-[var(--noc-surface)] border border-[var(--noc-border)] rounded-lg p-4 relative overflow-hidden"
          >
            {/* Color accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
              style={{ backgroundColor: cable.color }}
            />

            {/* Cable name + capacity */}
            <div className="flex items-center justify-between mt-1 mb-2">
              <span className="font-mono text-sm font-bold" style={{ color: cable.color }}>
                {cable.shortName}
              </span>
              <span className="font-mono text-xs text-[var(--noc-text-dim)]">
                {cable.capacityLabel}
              </span>
            </div>

            {/* Sparkline */}
            {history.length > 1 && (
              <div className="mb-2">
                <Sparkline data={history} color={cable.color} width={200} height={32} />
              </div>
            )}

            {/* Current throughput */}
            <div className="font-mono text-lg font-bold text-[var(--noc-text)] mb-1">
              {formatThroughput(throughput)}
            </div>

            {/* Utilization bar */}
            <div className="mb-2">
              <div className="flex justify-between text-[10px] font-mono text-[var(--noc-text-dim)] mb-1">
                <span>NÝTING</span>
                <span>{Math.round(utilization * 100)}%</span>
              </div>
              <div className="h-1.5 bg-[var(--noc-border)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${utilization * 100}%`,
                    backgroundColor: utilization > 0.85 ? "var(--noc-red)" : cable.color,
                  }}
                />
              </div>
            </div>

            {/* Latency + endpoints */}
            <div className="flex justify-between text-[10px] font-mono text-[var(--noc-text-dim)]">
              <span>{Math.round(latency)}ms</span>
              <span>{cable.endpoints[0].split(",")[0]} → {cable.endpoints[1].split(",")[0]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
