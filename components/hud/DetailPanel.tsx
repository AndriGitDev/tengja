"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cables } from "@/lib/data/cables";
import { nodes } from "@/lib/data/nodes";
import { ixpMembers } from "@/lib/data/ixp-members";
import { GlowText } from "@/components/ui/GlowText";

interface DetailPanelProps {
  selectedId: string | null;
  type: "cable" | "node" | null;
  onClose: () => void;
}

export function DetailPanel({ selectedId, type, onClose }: DetailPanelProps) {
  const isOpen = selectedId !== null && type !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute top-14 right-4 z-10 w-72 bg-[var(--noc-surface)]/90 backdrop-blur-md border border-[var(--noc-border)] rounded-lg overflow-hidden"
        >
          <div className="flex items-center justify-between p-3 border-b border-[var(--noc-border)]">
            <span className="font-mono text-xs tracking-wider text-[var(--noc-text-dim)]">
              {type === "cable" ? "CABLE DETAIL" : "NODE DETAIL"}
            </span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--noc-border)] rounded transition-colors"
            >
              <X size={14} className="text-[var(--noc-text-dim)]" />
            </button>
          </div>

          <div className="p-3 space-y-3">
            {type === "cable" && <CableDetail id={selectedId!} />}
            {type === "node" && <NodeDetail id={selectedId!} />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CableDetail({ id }: { id: string }) {
  const cable = cables.find((c) => c.id === id);
  if (!cable) return null;

  return (
    <>
      <GlowText
        color={
          cable.color === "#00f0ff"
            ? "cyan"
            : cable.color === "#ffaa00"
              ? "amber"
              : "green"
        }
        className="text-sm font-bold tracking-wider"
      >
        {cable.name}
      </GlowText>

      <div className="space-y-2 text-xs">
        <Row label="Route" value={`${cable.endpoints[0]} → ${cable.endpoints[1]}`} />
        <Row label="Length" value={`${cable.lengthKm.toLocaleString()} km`} />
        <Row label="Capacity" value={cable.capacityLabel} />
        <Row label="Owner" value={cable.owner} />
        <Row label="Year Lit" value={String(cable.yearLit)} />
        <Row
          label="Landing Points"
          value={cable.route
            .filter((p) => p.label)
            .map((p) => p.label)
            .join(" → ")}
        />
      </div>
    </>
  );
}

function NodeDetail({ id }: { id: string }) {
  const node = nodes.find((n) => n.id === id);
  if (!node) return null;

  return (
    <>
      <GlowText color="cyan" className="text-sm font-bold tracking-wider">
        {node.name}
      </GlowText>

      <div className="space-y-2 text-xs">
        <Row
          label="Type"
          value={
            node.type === "ixp"
              ? "Internet Exchange"
              : node.type === "datacenter"
                ? "Data Center"
                : node.type === "landing"
                  ? "Cable Landing"
                  : "RIPE Probe"
          }
        />
        <Row label="Coordinates" value={`${node.lat.toFixed(2)}°N, ${Math.abs(node.lng).toFixed(2)}°W`} />
        <Row label="Description" value={node.description} />
        {node.cables && (
          <Row
            label="Connected Cables"
            value={node.cables
              .map((cid) => cables.find((c) => c.id === cid)?.name ?? cid)
              .join(", ")}
          />
        )}
      </div>

      {node.type === "ixp" && (
        <div className="mt-3 pt-3 border-t border-[var(--noc-border)]">
          <span className="font-mono text-[10px] tracking-wider text-[var(--noc-text-dim)] block mb-2">
            IX MEMBERS
          </span>
          {ixpMembers.map((m) => (
            <div
              key={m.asn}
              className="flex justify-between text-[11px] font-mono py-0.5"
            >
              <span>
                {m.name}{" "}
                <span className="text-[var(--noc-text-dim)]">AS{m.asn}</span>
              </span>
              <span className="text-[var(--noc-cyan)] tabular-nums">{m.speed}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-mono text-[10px] tracking-wider text-[var(--noc-text-dim)] block">
        {label.toUpperCase()}
      </span>
      <span className="font-mono text-[var(--noc-text)]">{value}</span>
    </div>
  );
}
