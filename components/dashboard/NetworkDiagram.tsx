"use client";

import { cables } from "@/lib/data/cables";
import { nodes } from "@/lib/data/nodes";
import { ixpMembers } from "@/lib/data/ixp-members";

// Logical positions for the SVG schematic
const POSITIONS: Record<string, { x: number; y: number }> = {
  // International endpoints (left side)
  "blaabjerg": { x: 60, y: 60 },
  "dunnet": { x: 60, y: 140 },
  "galway": { x: 60, y: 220 },
  "nuuk": { x: 60, y: 300 },
  "halifax": { x: 60, y: 370 },
  "funningsfjordur": { x: 60, y: 140 },
  // Landing stations (center-left)
  "landeyjar": { x: 240, y: 100 },
  "seydisfjordur": { x: 240, y: 180 },
  "thorlakshofn": { x: 240, y: 260 },
  // IXP hub (center)
  "rix-tg": { x: 420, y: 140 },
  "rix-k2": { x: 420, y: 200 },
  "rix-mh": { x: 420, y: 260 },
  // Data centers (center-right)
  "verne-global": { x: 580, y: 80 },
  "atnorth-ice01": { x: 580, y: 140 },
  "atnorth-ice02": { x: 580, y: 200 },
  "atnorth-ice03": { x: 580, y: 260 },
  "borealis-rvk": { x: 580, y: 320 },
  // PoPs (right)
  "siminn-hq": { x: 720, y: 100 },
  "mila-hq": { x: 720, y: 160 },
  "nova-hq": { x: 720, y: 220 },
  "hringdu-hq": { x: 720, y: 280 },
};

const TYPE_COLORS: Record<string, string> = {
  landing: "#00f0ff",
  datacenter: "#ffaa00",
  ixp: "#00ff88",
  probe: "#8888ff",
  pop: "#cc66ff",
};

const TYPE_LABELS: Record<string, string> = {
  landing: "LENDINGARSTÖÐ",
  datacenter: "GAGNAVERI",
  ixp: "NETSKIPTI",
  pop: "FJARSKIPTAMIÐSTÖÐ",
};

// Cable connections (from landing → international endpoint)
const CABLE_LINKS = [
  { cableId: "danice", from: "landeyjar", to: "blaabjerg" },
  { cableId: "farice1", from: "seydisfjordur", to: "dunnet" },
  { cableId: "greenland-connect", from: "landeyjar", to: "nuuk" },
  { cableId: "iris", from: "thorlakshofn", to: "galway" },
];

// Internal connections (landing → IXP)
const INTERNAL_LINKS = [
  { from: "landeyjar", to: "rix-tg" },
  { from: "seydisfjordur", to: "rix-tg" },
  { from: "thorlakshofn", to: "rix-tg" },
  { from: "rix-tg", to: "verne-global" },
  { from: "rix-tg", to: "atnorth-ice01" },
  { from: "rix-k2", to: "atnorth-ice02" },
  { from: "rix-mh", to: "siminn-hq" },
  { from: "rix-tg", to: "rix-k2" },
  { from: "rix-k2", to: "rix-mh" },
  { from: "rix-mh", to: "mila-hq" },
  { from: "rix-tg", to: "nova-hq" },
  { from: "rix-mh", to: "hringdu-hq" },
];

export function NetworkDiagram() {
  const visibleNodes = nodes.filter((n) => POSITIONS[n.id]);

  return (
    <div className="px-4">
      <div className="bg-[var(--noc-surface)] border border-[var(--noc-border)] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono text-xs tracking-[0.2em] text-[var(--noc-text-dim)] uppercase">
            Nettopólógía
          </h2>
          <div className="flex gap-4">
            {Object.entries(TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
                <span className="text-[9px] font-mono text-[var(--noc-text-dim)]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <svg viewBox="0 0 800 420" className="w-full" style={{ maxHeight: "320px" }}>
          {/* Cable connections (colored by cable) */}
          {CABLE_LINKS.map((link) => {
            const cable = cables.find((c) => c.id === link.cableId);
            const from = POSITIONS[link.from];
            const to = POSITIONS[link.to];
            if (!from || !to || !cable) return null;
            return (
              <g key={`cable-${link.cableId}`}>
                {/* Glow */}
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={cable.color} strokeWidth={4} opacity={0.15}
                />
                {/* Line */}
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  stroke={cable.color} strokeWidth={2} opacity={0.6}
                  strokeDasharray="6 3"
                />
                {/* Label */}
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 8}
                  textAnchor="middle"
                  fill={cable.color}
                  fontSize={8}
                  fontFamily="'Geist Mono', monospace"
                  opacity={0.7}
                >
                  {cable.shortName}
                </text>
              </g>
            );
          })}

          {/* Internal connections (gray) */}
          {INTERNAL_LINKS.map((link, i) => {
            const from = POSITIONS[link.from];
            const to = POSITIONS[link.to];
            if (!from || !to) return null;
            return (
              <line
                key={`int-${i}`}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="#2a3040" strokeWidth={1} opacity={0.5}
              />
            );
          })}

          {/* Nodes */}
          {visibleNodes.map((node) => {
            const pos = POSITIONS[node.id];
            if (!pos) return null;
            const color = TYPE_COLORS[node.type] || "#ffffff";
            const isIxp = node.type === "ixp";
            const r = isIxp ? 14 : 8;

            return (
              <g key={node.id}>
                {/* Glow */}
                <circle cx={pos.x} cy={pos.y} r={r + 4} fill={color} opacity={0.1} />
                {/* Node */}
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill="none" stroke={color} strokeWidth={1.5} opacity={0.8}
                />
                <circle cx={pos.x} cy={pos.y} r={r * 0.4} fill={color} opacity={0.9} />
                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + r + 12}
                  textAnchor="middle"
                  fill={color}
                  fontSize={7}
                  fontFamily="'Geist Mono', monospace"
                  opacity={0.8}
                >
                  {node.name.replace(" (Keflavík)", "").replace(" (Hafnarfjörður)", "").replace(" (Reykjavík)", "").replace(" (Akureyri)", "").replace(" (Blönduós)", "").replace(" (Kópavogur)", "").split("(")[0].trim()}
                </text>
              </g>
            );
          })}

          {/* IXP members label */}
          <text x={420} y={310} textAnchor="middle" fill="#00ff88" fontSize={8} fontFamily="'Geist Mono', monospace" opacity={0.5}>
            {ixpMembers.length} RIX MEÐLIMIR
          </text>
        </svg>
      </div>
    </div>
  );
}
