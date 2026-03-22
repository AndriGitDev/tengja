import { ixpMembers } from "./ixp-members";
import { cables } from "./cables";
import { nodes } from "./nodes";

export interface SubComponent {
  id: string;
  label: string;
  sublabel?: string;
  color: string;
  size: number; // relative size 0-1
}

export interface NodeExpansion {
  nodeId: string;
  subComponents: SubComponent[];
}

function getIxpExpansion(nodeId: string): NodeExpansion {
  return {
    nodeId,
    subComponents: ixpMembers.map((m) => ({
      id: `${nodeId}-member-${m.asn}`,
      label: m.name,
      sublabel: `AS${m.asn} ${m.speed}`,
      color: "#00ff88",
      size: 0.5,
    })),
  };
}

function getLandingExpansion(nodeId: string): NodeExpansion {
  const node = nodes.find((n) => n.id === nodeId);
  const connectedCables = cables.filter((c) =>
    node?.cables?.includes(c.id),
  );
  return {
    nodeId,
    subComponents: connectedCables.map((c) => ({
      id: `${nodeId}-cable-${c.id}`,
      label: c.shortName,
      sublabel: c.capacityLabel,
      color: c.color,
      size: 0.6,
    })),
  };
}

function getDcExpansion(nodeId: string): NodeExpansion {
  const node = nodes.find((n) => n.id === nodeId);
  const subs: SubComponent[] = [];
  // Show capacity info
  const desc = node?.description || "";
  const mwMatch = desc.match(/(\d+)\s*MW/);
  if (mwMatch) {
    subs.push({
      id: `${nodeId}-power`,
      label: `${mwMatch[1]} MW`,
      sublabel: "POWER",
      color: "#ffaa00",
      size: 0.4,
    });
  }
  subs.push({
    id: `${nodeId}-renewable`,
    label: "100%",
    sublabel: "RENEWABLE",
    color: "#00ff88",
    size: 0.35,
  });
  return { nodeId, subComponents: subs };
}

function getPopExpansion(nodeId: string): NodeExpansion {
  const node = nodes.find((n) => n.id === nodeId);
  const desc = node?.description || "";
  return {
    nodeId,
    subComponents: [
      {
        id: `${nodeId}-info`,
        label: node?.name.replace(" HQ", "") || "",
        sublabel: desc.length > 40 ? desc.slice(0, 37) + "..." : desc,
        color: "#cc66ff",
        size: 0.45,
      },
    ],
  };
}

// Build expansion map
const expansionMap = new Map<string, NodeExpansion>();

// IXPs
for (const id of ["rix-tg", "rix-k2", "rix-mh"]) {
  expansionMap.set(id, getIxpExpansion(id));
}

// Landing stations (Icelandic ones only — international endpoints don't expand)
for (const id of ["landeyjar", "seydisfjordur", "thorlakshofn"]) {
  expansionMap.set(id, getLandingExpansion(id));
}

// Data centers
for (const id of [
  "verne-global", "atnorth-ice01", "atnorth-ice02", "atnorth-ice03",
  "borealis-blonduos", "borealis-fitjar", "borealis-rvk",
]) {
  expansionMap.set(id, getDcExpansion(id));
}

// PoPs
for (const id of ["siminn-hq", "mila-hq", "nova-hq", "hringdu-hq"]) {
  expansionMap.set(id, getPopExpansion(id));
}

export function getNodeExpansion(nodeId: string): NodeExpansion | null {
  return expansionMap.get(nodeId) || null;
}
