"use client";

import { useEffect, useState, useRef } from "react";
import { cables, type Cable } from "@/lib/data/cables";
import { nodes, type NetworkNode } from "@/lib/data/nodes";

// Simplified layout — 5 logical columns, bigger spacing
const POSITIONS: Record<string, { x: number; y: number }> = {
  // International (far left)
  "blaabjerg":    { x: 50,  y: 70 },
  "dunnet":       { x: 50,  y: 170 },
  "galway":       { x: 50,  y: 270 },
  "nuuk":         { x: 50,  y: 370 },
  // Landing stations
  "landeyjar":    { x: 230, y: 120 },
  "seydisfjordur":{ x: 230, y: 220 },
  "thorlakshofn": { x: 230, y: 320 },
  // IXP hub (center)
  "rix-tg":       { x: 420, y: 160 },
  "rix-k2":       { x: 420, y: 250 },
  "rix-mh":       { x: 420, y: 340 },
  // Data centers
  "verne-global": { x: 600, y: 90 },
  "atnorth-ice01":{ x: 600, y: 170 },
  "atnorth-ice02":{ x: 600, y: 250 },
  "atnorth-ice03":{ x: 600, y: 330 },
  "borealis-rvk": { x: 600, y: 410 },
  // PoPs (right)
  "siminn-hq":    { x: 770, y: 120 },
  "mila-hq":      { x: 770, y: 210 },
  "nova-hq":      { x: 770, y: 300 },
  "hringdu-hq":   { x: 770, y: 390 },
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

const CABLE_LINKS = [
  { cableId: "danice", from: "landeyjar", to: "blaabjerg" },
  { cableId: "farice1", from: "seydisfjordur", to: "dunnet" },
  { cableId: "greenland-connect", from: "landeyjar", to: "nuuk" },
  { cableId: "iris", from: "thorlakshofn", to: "galway" },
];

const INTERNAL_LINKS = [
  { from: "landeyjar", to: "rix-tg" },
  { from: "seydisfjordur", to: "rix-tg" },
  { from: "thorlakshofn", to: "rix-mh" },
  { from: "rix-tg", to: "verne-global" },
  { from: "rix-tg", to: "atnorth-ice01" },
  { from: "rix-k2", to: "atnorth-ice02" },
  { from: "rix-mh", to: "atnorth-ice03" },
  { from: "rix-tg", to: "rix-k2" },
  { from: "rix-k2", to: "rix-mh" },
  { from: "verne-global", to: "siminn-hq" },
  { from: "atnorth-ice01", to: "mila-hq" },
  { from: "atnorth-ice02", to: "nova-hq" },
  { from: "atnorth-ice03", to: "hringdu-hq" },
];

interface HoverInfo {
  node?: NetworkNode;
  cable?: Cable;
  x: number;
  y: number;
}

export function NetworkDiagram() {
  const [memberCount, setMemberCount] = useState(6);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch("/api/peeringdb/rix")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.uniqueAsnCount) setMemberCount(d.uniqueAsnCount); })
      .catch(() => {});
  }, []);

  const visibleNodes = nodes.filter((n) => POSITIONS[n.id]);

  function getClientPos(svgX: number, svgY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return {
      x: rect.left + ((svgX - vb.x) / vb.width) * rect.width,
      y: rect.top + ((svgY - vb.y) / vb.height) * rect.height,
    };
  }

  function onNodeEnter(node: NetworkNode) {
    const pos = POSITIONS[node.id];
    if (!pos) return;
    const client = getClientPos(pos.x, pos.y);
    setHover({ node, x: client.x, y: client.y });
  }

  function onCableEnter(cable: Cable, fromId: string, toId: string) {
    const from = POSITIONS[fromId];
    const to = POSITIONS[toId];
    if (!from || !to) return;
    const mid = getClientPos((from.x + to.x) / 2, (from.y + to.y) / 2);
    setHover({ cable, x: mid.x, y: mid.y });
  }

  return (
    <div className="bg-[var(--noc-surface)] border border-[var(--noc-border)] rounded-lg p-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-mono text-xs tracking-[0.2em] text-[var(--noc-text-dim)] uppercase">
          Nettopólógía
        </h2>
        <div className="flex gap-3">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
              <span className="text-[8px] font-mono text-[var(--noc-text-dim)]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SVG diagram — taller viewBox, no maxHeight constraint */}
      <svg
        ref={svgRef}
        viewBox="0 0 840 480"
        className="w-full"
        onMouseLeave={() => setHover(null)}
      >
        {/* Column labels */}
        <text x={50} y={30} textAnchor="middle" fill="#3a3a4a" fontSize={9} fontFamily="'Geist Mono', monospace">ERLENT</text>
        <text x={230} y={30} textAnchor="middle" fill="#3a3a4a" fontSize={9} fontFamily="'Geist Mono', monospace">LENDING</text>
        <text x={420} y={30} textAnchor="middle" fill="#3a3a4a" fontSize={9} fontFamily="'Geist Mono', monospace">RIX</text>
        <text x={600} y={30} textAnchor="middle" fill="#3a3a4a" fontSize={9} fontFamily="'Geist Mono', monospace">GAGNAVERI</text>
        <text x={770} y={30} textAnchor="middle" fill="#3a3a4a" fontSize={9} fontFamily="'Geist Mono', monospace">FJARSKIPTI</text>

        {/* Cable connections */}
        {CABLE_LINKS.map((link) => {
          const cable = cables.find((c) => c.id === link.cableId);
          const from = POSITIONS[link.from];
          const to = POSITIONS[link.to];
          if (!from || !to || !cable) return null;
          return (
            <g
              key={`cable-${link.cableId}`}
              onMouseEnter={() => onCableEnter(cable, link.from, link.to)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Hit area */}
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="transparent" strokeWidth={14} />
              {/* Glow */}
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={cable.color} strokeWidth={6} opacity={0.08} />
              {/* Cable line */}
              <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={cable.color} strokeWidth={2.5} opacity={0.7} strokeDasharray="8 4" />
              {/* Label */}
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 10}
                textAnchor="middle"
                fill={cable.color}
                fontSize={10}
                fontFamily="'Geist Mono', monospace"
                fontWeight="bold"
                opacity={0.9}
              >
                {cable.shortName}
              </text>
            </g>
          );
        })}

        {/* Internal connections */}
        {INTERNAL_LINKS.map((link, i) => {
          const from = POSITIONS[link.from];
          const to = POSITIONS[link.to];
          if (!from || !to) return null;
          return (
            <line
              key={`int-${i}`}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke="#2a3040" strokeWidth={1.2} opacity={0.4}
            />
          );
        })}

        {/* Nodes */}
        {visibleNodes.map((node) => {
          const pos = POSITIONS[node.id];
          if (!pos) return null;
          const color = TYPE_COLORS[node.type] || "#ffffff";
          const isIxp = node.type === "ixp";
          const r = isIxp ? 16 : 10;

          // Shorter label
          const label = node.name
            .replace(" (Keflavík)", "").replace(" (Hafnarfjörður)", "")
            .replace(" (Reykjavík)", "").replace(" (Akureyri)", "")
            .replace(" (Blönduós)", "").replace(" (Kópavogur)", "")
            .split("(")[0].trim();

          return (
            <g
              key={node.id}
              onMouseEnter={() => onNodeEnter(node)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Hit area */}
              <circle cx={pos.x} cy={pos.y} r={r + 8} fill="transparent" />
              {/* Outer glow */}
              <circle cx={pos.x} cy={pos.y} r={r + 5} fill={color} opacity={0.08} />
              {/* Ring */}
              <circle cx={pos.x} cy={pos.y} r={r} fill="none" stroke={color} strokeWidth={1.8} opacity={0.8} />
              {/* Dot */}
              <circle cx={pos.x} cy={pos.y} r={r * 0.35} fill={color} opacity={0.9} />
              {/* Label */}
              <text
                x={pos.x}
                y={pos.y + r + 14}
                textAnchor="middle"
                fill={color}
                fontSize={9}
                fontFamily="'Geist Mono', monospace"
                opacity={0.9}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* IXP member count badge */}
        <rect x={380} y={390} width={80} height={22} rx={4} fill="#00ff8815" stroke="#00ff8830" strokeWidth={1} />
        <text x={420} y={405} textAnchor="middle" fill="#00ff88" fontSize={10} fontFamily="'Geist Mono', monospace" fontWeight="bold">
          {memberCount} ASN
        </text>
      </svg>

      {/* Hover tooltip — rendered as fixed-position overlay */}
      {hover && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: hover.x + 16,
            top: hover.y - 20,
          }}
        >
          <div className="bg-[#0c0c14] border border-[var(--noc-border)] rounded-lg p-3 shadow-2xl min-w-[220px] max-w-[320px]"
            style={{ boxShadow: "0 0 20px rgba(0,0,0,0.8), 0 0 40px rgba(0,240,255,0.05)" }}
          >
            {hover.node && <NodeTooltip node={hover.node} />}
            {hover.cable && <CableTooltip cable={hover.cable} />}
          </div>
        </div>
      )}
    </div>
  );
}

function NodeTooltip({ node }: { node: NetworkNode }) {
  const color = TYPE_COLORS[node.type] || "#ffffff";
  const typeLabel = TYPE_LABELS[node.type] || node.type.toUpperCase();

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
        <span className="font-mono text-sm font-bold" style={{ color }}>{node.name}</span>
      </div>
      <div className="font-mono text-[10px] text-[var(--noc-text-dim)] uppercase tracking-wider mb-1.5">{typeLabel}</div>
      <p className="font-mono text-[11px] text-[var(--noc-text)] leading-relaxed mb-2">{node.description}</p>
      {node.cables && node.cables.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-[var(--noc-border)]">
          {node.cables.map((cableId) => {
            const cable = cables.find((c) => c.id === cableId);
            if (!cable) return null;
            return (
              <span key={cableId} className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: cable.color + "20", color: cable.color }}>
                {cable.shortName}
              </span>
            );
          })}
        </div>
      )}
      <div className="font-mono text-[9px] text-[var(--noc-text-dim)] mt-1.5">
        {node.lat.toFixed(3)}°N, {Math.abs(node.lng).toFixed(3)}°W
      </div>
    </>
  );
}

function CableTooltip({ cable }: { cable: Cable }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-1 rounded" style={{ backgroundColor: cable.color, boxShadow: `0 0 6px ${cable.color}` }} />
        <span className="font-mono text-sm font-bold" style={{ color: cable.color }}>{cable.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
        <span className="text-[var(--noc-text-dim)]">Afkastageta</span>
        <span className="text-[var(--noc-text)] text-right">{cable.capacityLabel}</span>
        <span className="text-[var(--noc-text-dim)]">Lengd</span>
        <span className="text-[var(--noc-text)] text-right">{cable.lengthKm.toLocaleString()} km</span>
        <span className="text-[var(--noc-text-dim)]">Eigandi</span>
        <span className="text-[var(--noc-text)] text-right">{cable.owner}</span>
        <span className="text-[var(--noc-text-dim)]">Kveikt</span>
        <span className="text-[var(--noc-text)] text-right">{cable.yearLit}</span>
      </div>
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[var(--noc-border)] font-mono text-[10px]">
        <span className="text-[var(--noc-text-dim)]">{cable.endpoints[0]}</span>
        <span style={{ color: cable.color }}>⟷</span>
        <span className="text-[var(--noc-text-dim)]">{cable.endpoints[1]}</span>
      </div>
    </>
  );
}
