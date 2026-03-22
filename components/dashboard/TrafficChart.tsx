"use client";

import { useEffect, useRef, useState } from "react";
import { cables } from "@/lib/data/cables";
import { generateCableMetrics } from "@/lib/simulation/metrics";

export function TrafficChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Record<string, number[]>>({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const tick = () => {
      const metrics = generateCableMetrics();
      let sum = 0;
      for (const cm of metrics) {
        if (!historyRef.current[cm.cableId]) historyRef.current[cm.cableId] = [];
        const h = historyRef.current[cm.cableId];
        h.push(cm.throughputTbps);
        if (h.length > 60) h.shift();
        sum += cm.throughputTbps;
      }
      setTotal(sum);
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
    const h = 120;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Find max for y-axis
    let maxVal = 1;
    for (const cable of cables) {
      const history = historyRef.current[cable.id] || [];
      for (const v of history) {
        if (v > maxVal) maxVal = v;
      }
    }
    maxVal *= 1.2;

    // Draw stacked area chart
    const cableOrder = [...cables].sort((a, b) => b.capacityTbps - a.capacityTbps);
    const maxLen = Math.max(...cables.map((c) => (historyRef.current[c.id] || []).length), 1);

    // Draw each cable as a line
    for (const cable of cableOrder) {
      const history = historyRef.current[cable.id] || [];
      if (history.length < 2) continue;

      const step = w / (maxLen - 1 || 1);

      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < history.length; i++) {
        const x = (maxLen - history.length + i) * step;
        const y = h - (history[i] / maxVal) * (h - 10);
        ctx.lineTo(x, y);
      }
      ctx.lineTo((maxLen - 1) * step, h);
      ctx.closePath();

      // Fill
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, cable.color + "30");
      grad.addColorStop(1, cable.color + "05");
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      for (let i = 0; i < history.length; i++) {
        const x = (maxLen - history.length + i) * step;
        const y = h - (history[i] / maxVal) * (h - 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = cable.color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Y-axis labels
    ctx.fillStyle = "#6a6a7a";
    ctx.font = "9px 'Geist Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${maxVal.toFixed(0)} Tbps`, w - 4, 12);
    ctx.fillText("0", w - 4, h - 2);
  }

  return (
    <div className="bg-[var(--noc-surface)] border border-[var(--noc-border)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-mono text-xs tracking-[0.2em] text-[var(--noc-text-dim)] uppercase">
          Umferð yfir tíma
          </h2>
          <span className="font-mono text-sm font-bold text-[var(--noc-text)]">
            {total.toFixed(1)} Tbps
          </span>
        </div>
        <div ref={containerRef}>
          <canvas ref={canvasRef} className="w-full rounded" />
        </div>
        {/* Legend */}
        <div className="flex gap-4 mt-2 justify-center">
          {cables.map((cable) => (
            <div key={cable.id} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded" style={{ backgroundColor: cable.color }} />
              <span className="text-[9px] font-mono text-[var(--noc-text-dim)]">{cable.shortName}</span>
            </div>
          ))}
        </div>
    </div>
  );
}
