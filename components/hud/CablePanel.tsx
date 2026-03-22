"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cables } from "@/lib/data/cables";
import { generateCableMetrics, type CableMetrics } from "@/lib/simulation/metrics";
import { Sparkline } from "@/components/ui/Sparkline";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface CablePanelProps {
  onCableClick?: (cableId: string) => void;
}

export function CablePanel({ onCableClick }: CablePanelProps) {
  const [metrics, setMetrics] = useState<CableMetrics[]>([]);
  const historyRef = useRef<Record<string, number[]>>({});

  const tick = useCallback(() => {
    const m = generateCableMetrics();
    setMetrics(m);
    for (const cm of m) {
      if (!historyRef.current[cm.cableId]) historyRef.current[cm.cableId] = [];
      historyRef.current[cm.cableId].push(cm.throughputTbps);
      if (historyRef.current[cm.cableId].length > 30) {
        historyRef.current[cm.cableId].shift();
      }
    }
  }, []);

  useEffect(() => {
    tick();
    const interval = setInterval(tick, 2000);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <div className="absolute top-14 left-4 z-10 w-64 space-y-1 pointer-events-none">
      {cables.map((cable) => {
        const cm = metrics.find((m) => m.cableId === cable.id);
        const history = historyRef.current[cable.id] || [];
        if (!cm) return null;

        const formatThroughput =
          cm.throughputTbps >= 1
            ? `${cm.throughputTbps.toFixed(1)} Tbps`
            : `${(cm.throughputTbps * 1000).toFixed(0)} Gbps`;

        return (
          <button
            key={cable.id}
            onClick={() => onCableClick?.(cable.id)}
            className="pointer-events-auto w-full text-left bg-[var(--noc-surface)]/80 backdrop-blur-sm border border-[var(--noc-border)] rounded px-3 py-2 hover:border-[color:var(--noc-cyan)]/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: cable.color,
                    boxShadow: `0 0 6px ${cable.color}`,
                  }}
                />
                <span className="font-mono text-xs font-bold tracking-wider">
                  {cable.shortName}
                </span>
              </div>
              <span
                className="font-mono text-xs tabular-nums font-bold"
                style={{ color: cable.color }}
              >
                {formatThroughput}
              </span>
            </div>
            <div className="text-[10px] text-[var(--noc-text-dim)] font-mono mb-1">
              {cable.endpoints[0]} → {cable.endpoints[1]}
            </div>
            <div className="flex items-center justify-between">
              <Sparkline
                data={history.length > 1 ? history : [0, 0]}
                color={cable.color}
                width={140}
                height={20}
              />
              <span className="font-mono text-[10px] tabular-nums text-[var(--noc-text-dim)]">
                {cm.latencyMs.toFixed(0)}ms
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
