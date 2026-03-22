import { nodes } from "@/lib/data/nodes";
import type { RenderContext } from "../helpers";
import { projectPoint, isInViewport } from "../helpers";
import { TYPE_COLORS } from "../constants";
import type { ClusterDot } from "../hooks/useSemanticZoom";

interface LabelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function rectsOverlap(a: LabelRect, b: LabelRect): boolean {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

function canPlace(rect: LabelRect, placed: LabelRect[]): boolean {
  for (const p of placed) {
    if (rectsOverlap(rect, p)) return false;
  }
  return true;
}

// Priority: higher = shown first when labels compete for space
const TYPE_PRIORITY: Record<string, number> = {
  ixp: 5,
  landing: 4,
  datacenter: 3,
  pop: 2,
  probe: 1,
};

// ── Tier 1: Region labels under cluster dots ────────────────────
export function drawClusterLabels(
  rc: RenderContext,
  clusters: ClusterDot[],
  transitionAlpha: number,
): void {
  const { ctx } = rc;

  for (const cluster of clusters) {
    ctx.save();
    ctx.globalAlpha = 0.6 * transitionAlpha;
    ctx.fillStyle = cluster.dominantColor;
    ctx.font = "bold 9px 'Geist Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const radius = 10 + cluster.nodeCount * 1.5;
    ctx.fillText(cluster.nameIs, cluster.x, cluster.y + radius + 6);
    ctx.restore();
  }
}

// ── Tier 2+: Node name labels with collision avoidance ──────────
export function drawNodeLabels(
  rc: RenderContext,
  transitionAlpha: number,
): void {
  const { ctx, projection, transform, width, height, zoomTier, hoveredNodeId } = rc;

  const fontSize = 8;
  const padding = 4;
  const placed: LabelRect[] = [];

  // Sort nodes by priority (important types rendered first, get label priority)
  const sortedNodes = [...nodes].sort((a, b) => {
    // Hovered node always wins
    if (a.id === hoveredNodeId) return -1;
    if (b.id === hoveredNodeId) return 1;
    return (TYPE_PRIORITY[b.type] || 0) - (TYPE_PRIORITY[a.type] || 0);
  });

  // At tier 2, skip probes to reduce clutter
  const showTypes = zoomTier >= 3
    ? new Set(["landing", "datacenter", "ixp", "probe", "pop"])
    : new Set(["landing", "datacenter", "ixp", "pop"]);

  for (const node of sortedNodes) {
    // Always show hovered node, otherwise filter by type
    if (node.id !== hoveredNodeId && !showTypes.has(node.type)) continue;

    const coord: [number, number] = [node.lng, node.lat];
    const projected = projectPoint(projection, transform, coord);
    if (!projected) continue;
    const [nx, ny] = projected;
    if (!isInViewport(nx, ny, width, height)) continue;

    const color = TYPE_COLORS[node.type] || "#ffffff";
    const isHovered = node.id === hoveredNodeId;
    const labelText = node.name;

    // Estimate label width (monospace: ~5px per char at 8px font)
    const textWidth = labelText.length * 5;
    const labelY = ny + 16;
    const rect: LabelRect = {
      x: nx - textWidth / 2 - padding,
      y: labelY - padding,
      w: textWidth + padding * 2,
      h: fontSize + padding * 2,
    };

    // Hovered labels always show; others must pass collision check
    if (!isHovered && !canPlace(rect, placed)) continue;

    placed.push(rect);

    // Draw label
    ctx.save();
    ctx.globalAlpha = (isHovered ? 0.95 : 0.65) * transitionAlpha;
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px 'Geist Mono', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(labelText, nx, labelY);
    ctx.restore();
  }
}
