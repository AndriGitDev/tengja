import { nodes } from "@/lib/data/nodes";
import type { RenderContext } from "../helpers";
import { projectPoint, isInViewport } from "../helpers";
import { TYPE_COLORS } from "../constants";
import type { ClusterDot } from "../hooks/useSemanticZoom";

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

// ── Tier 2+: Node name labels ───────────────────────────────────
export function drawNodeLabels(
  rc: RenderContext,
  transitionAlpha: number,
): void {
  const { ctx, projection, transform, width, height, zoomTier } = rc;

  // At tier 2, show names for all node types
  // At tier 3, show names only for non-expanded context
  const fontSize = zoomTier === 3 ? 9 : 8;

  for (const node of nodes) {
    const coord: [number, number] = [node.lng, node.lat];
    const projected = projectPoint(projection, transform, coord);
    if (!projected) continue;
    const [nx, ny] = projected;
    if (!isInViewport(nx, ny, width, height)) continue;

    const color = TYPE_COLORS[node.type] || "#ffffff";

    ctx.save();
    ctx.globalAlpha = 0.7 * transitionAlpha;
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px 'Geist Mono', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(node.name, nx, ny + 18);

    // Type label (smaller, dimmer)
    ctx.globalAlpha = 0.35 * transitionAlpha;
    ctx.fillStyle = "#6a6a7a";
    ctx.font = `${fontSize - 2}px 'Geist Mono', monospace`;
    ctx.fillText(node.type.toUpperCase(), nx, ny + 18 + fontSize + 2);
    ctx.restore();
  }
}
