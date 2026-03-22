"use client";

import { useEffect, useRef, useState } from "react";
import { cables } from "@/lib/data/cables";
import { generateCableMetrics, type CableMetrics } from "@/lib/simulation/metrics";

export function TrafficChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Record<string, number[]>>({});
  const [latest, setLatest] = useState<CableMetrics[]>([]);

  useEffect(() => {
    const tick = () => {
      const metrics = generateCableMetrics();
      for (const cm of metrics) {
        if (!historyRef.current[cm.cableId]) historyRef.current[cm.cableId] = [];
        const h = historyRef.current[cm.cableId];
        h.push(cm.throughputTbps);
        if (h.length > 60) h.shift();
      }
      setLatest(metrics);
      draw();
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  function draw() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height || 200;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Per-cable lanes stacked vertically
    const laneH = h / cables.length;
    const padding = 4;

    for (let ci = 0; ci < cables.length; ci++) {
      const cable = cables[ci];
      const history = historyRef.current[cable.id] || [];
      const laneY = ci * laneH;
      const chartH = laneH - padding * 2;
      const chartY = laneY + padding;

      // Lane separator
      if (ci > 0) {
        ctx.strokeStyle = "#1a1a2a";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, laneY);
        ctx.lineTo(w, laneY);
        ctx.stroke();
      }

      // Find max for this cable's y-axis
      const maxVal = Math.max(cable.capacityTbps * 0.95, ...history) * 1.1;
      const maxLen = 60;
      const step = w / (maxLen - 1);

      if (history.length >= 2) {
        // Gradient fill
        ctx.beginPath();
        ctx.moveTo(0, chartY + chartH);
        for (let i = 0; i < history.length; i++) {
          const x = (maxLen - history.length + i) * step;
          const y = chartY + chartH - (history[i] / maxVal) * chartH;
          ctx.lineTo(x, y);
        }
        ctx.lineTo((maxLen - 1) * step, chartY + chartH);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
        grad.addColorStop(0, cable.color + "25");
        grad.addColorStop(1, cable.color + "03");
        ctx.fillStyle = grad;
        ctx.fill();

        // Line
        ctx.beginPath();
        for (let i = 0; i < history.length; i++) {
          const x = (maxLen - history.length + i) * step;
          const y = chartY + chartH - (history[i] / maxVal) * chartH;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = cable.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Current value dot (last point)
        const lastVal = history[history.length - 1];
        const dotX = (maxLen - 1) * step;
        const dotY = chartY + chartH - (lastVal / maxVal) * chartH;

        // Glow
        ctx.beginPath();
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = cable.color + "40";
        ctx.fill();
        // Dot
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fillStyle = cable.color;
        ctx.fill();
      }

      // Capacity ceiling line (dashed)
      const ceilY = chartY + chartH - (cable.capacityTbps / maxVal) * chartH;
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = cable.color + "20";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, ceilY);
      ctx.lineTo(w, ceilY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  const total = latest.reduce((s, c) => s + c.throughputTbps, 0);

  return (
    <div className="bg-[var(--noc-surface)] border border-[var(--noc-border)] rounded-lg p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-mono text-xs tracking-[0.2em] text-[var(--noc-text-dim)] uppercase">
          Umferð yfir tíma
        </h2>
        <span className="font-mono text-sm font-bold text-[var(--noc-text)]">
          {total.toFixed(1)} Tbps
        </span>
      </div>

      {/* Per-cable stats strip */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        {cables.map((cable) => {
          const m = latest.find((cm) => cm.cableId === cable.id);
          if (!m) return null;
          const utilPct = Math.round(m.utilization * 100);
          return (
            <div key={cable.id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cable.color, boxShadow: `0 0 4px ${cable.color}` }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold" style={{ color: cable.color }}>{cable.shortName}</span>
                  <span className="font-mono text-[10px] text-[var(--noc-text)]">
                    {m.throughputTbps >= 1 ? `${m.throughputTbps.toFixed(1)}T` : `${(m.throughputTbps * 1000).toFixed(0)}G`}
                  </span>
                </div>
                {/* Utilization micro-bar */}
                <div className="w-full h-1 bg-[var(--noc-bg)] rounded-full mt-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${utilPct}%`,
                      backgroundColor: utilPct > 85 ? "var(--noc-red)" : cable.color,
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
              <span className="font-mono text-[9px] text-[var(--noc-text-dim)] w-8 text-right shrink-0">
                {utilPct}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Canvas — fills remaining space */}
      <div ref={containerRef} className="flex-1 min-h-[200px]">
        <canvas ref={canvasRef} className="w-full h-full rounded" />
      </div>

      {/* Footer: latency strip */}
      <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-[var(--noc-border)]">
        {cables.map((cable) => {
          const m = latest.find((cm) => cm.cableId === cable.id);
          return (
            <div key={cable.id} className="flex items-center gap-1.5">
              <span className="font-mono text-[9px]" style={{ color: cable.color }}>{cable.shortName}</span>
              <span className="font-mono text-[10px] text-[var(--noc-amber)]">
                {m ? `${m.latencyMs.toFixed(0)}ms` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
