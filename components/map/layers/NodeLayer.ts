import { nodes } from "@/lib/data/nodes";
import { getNodeExpansion } from "@/lib/data/node-expansions";
import type { RenderContext } from "../helpers";
import { projectPoint, isInViewport } from "../helpers";
import { TYPE_COLORS, TYPE_SCALE, EXPANSION_RADIUS } from "../constants";
import type { ClusterDot } from "../hooks/useSemanticZoom";

// ── Tier 1: Cluster dots ────────────────────────────────────────
export function drawClusters(
  rc: RenderContext,
  clusters: ClusterDot[],
  transitionAlpha: number,
): void {
  const { ctx, time } = rc;
  const t = time * 0.001;

  for (const cluster of clusters) {
    const baseRadius = 10 + cluster.nodeCount * 1.5;
    const pulse = 1 + Math.sin(t * 2) * 0.08;
    const radius = baseRadius * pulse;

    ctx.save();

    // Glow
    ctx.shadowColor = cluster.dominantColor;
    ctx.shadowBlur = 15;
    ctx.globalAlpha = 0.3 * transitionAlpha;
    ctx.fillStyle = cluster.dominantColor;
    ctx.beginPath();
    ctx.arc(cluster.x, cluster.y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Core dot
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.8 * transitionAlpha;
    ctx.beginPath();
    ctx.arc(cluster.x, cluster.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Count label
    ctx.shadowBlur = 0;
    ctx.globalAlpha = transitionAlpha;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'Geist Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(cluster.nodeCount), cluster.x, cluster.y);

    ctx.restore();
  }
}

// ── Tier 2+: Individual nodes ───────────────────────────────────
export function drawNodes(
  rc: RenderContext,
  transitionAlpha: number,
): void {
  const { ctx, projection, transform, time, width, height, hoveredNodeId } = rc;
  const t = time * 0.001;

  for (const node of nodes) {
    const coord: [number, number] = [node.lng, node.lat];
    const projected = projectPoint(projection, transform, coord);
    if (!projected) continue;
    const [nx, ny] = projected;
    if (!isInViewport(nx, ny, width, height)) continue;

    const color = TYPE_COLORS[node.type] || "#ffffff";
    const scale = TYPE_SCALE[node.type] || 1.0;
    const isHovered = hoveredNodeId === node.id;

    // Glow disc
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    const glowAlpha = isHovered ? 0.5 : 0.15 + Math.sin(t * 2) * 0.1;
    ctx.globalAlpha = glowAlpha * transitionAlpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(nx, ny, 16 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Outer ring (rotating dashes)
    ctx.save();
    const outerRadius = 12 * scale * (isHovered ? 1.4 : 1.0 + Math.sin(t * 1.5) * 0.15);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = (isHovered ? 0.7 : 0.35) * transitionAlpha;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = t * -20;
    ctx.beginPath();
    ctx.arc(nx, ny, outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Inner ring (counter-rotating hexagonal dashes)
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = (isHovered ? 0.9 : 0.5) * transitionAlpha;
    ctx.setLineDash([3, 7]);
    ctx.lineDashOffset = t * 40;
    ctx.beginPath();
    ctx.arc(nx, ny, 8 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Core colored ring
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.9 * transitionAlpha;
    ctx.beginPath();
    ctx.arc(nx, ny, 5 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Core white dot
    ctx.save();
    ctx.globalAlpha = transitionAlpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(nx, ny, 3.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── Tier 3: Expanded sub-components ─────────────────────────────
export function drawExpansions(
  rc: RenderContext,
  transitionAlpha: number,
): void {
  const { ctx, projection, transform, time, width, height, expandedNodeIds } = rc;
  if (expandedNodeIds.size === 0) return;
  const t = time * 0.001;

  for (const nodeId of expandedNodeIds) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const expansion = getNodeExpansion(nodeId);
    if (!expansion || expansion.subComponents.length === 0) continue;

    const parentPt = projectPoint(projection, transform, [node.lng, node.lat]);
    if (!parentPt) continue;
    const [px, py] = parentPt;
    if (!isInViewport(px, py, width, height, 100)) continue;

    const subs = expansion.subComponents;
    const angleStep = (Math.PI * 2) / subs.length;

    for (let i = 0; i < subs.length; i++) {
      const sub = subs[i];
      const angle = angleStep * i - Math.PI / 2; // Start from top
      const sx = px + Math.cos(angle) * EXPANSION_RADIUS;
      const sy = py + Math.sin(angle) * EXPANSION_RADIUS;

      // Staggered appearance
      const staggerDelay = i * 0.05;
      const subAlpha = Math.max(0, Math.min(1, (transitionAlpha - staggerDelay) / (1 - staggerDelay)));
      if (subAlpha <= 0) continue;

      // Connection line from parent to sub
      ctx.save();
      ctx.strokeStyle = sub.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2 * subAlpha;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.restore();

      // Sub-node dot
      const subRadius = 6 * sub.size;
      ctx.save();
      ctx.shadowColor = sub.color;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = 0.7 * subAlpha;
      ctx.fillStyle = sub.color;
      ctx.beginPath();
      ctx.arc(sx, sy, subRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Animated ring
      ctx.save();
      ctx.strokeStyle = sub.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4 * subAlpha;
      ctx.setLineDash([2, 4]);
      ctx.lineDashOffset = t * -15;
      ctx.beginPath();
      ctx.arc(sx, sy, subRadius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Label
      ctx.save();
      ctx.globalAlpha = 0.85 * subAlpha;
      ctx.fillStyle = sub.color;
      ctx.font = "bold 8px 'Geist Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(sub.label, sx, sy + subRadius + 5);

      if (sub.sublabel) {
        ctx.fillStyle = "#6a6a7a";
        ctx.font = "7px 'Geist Mono', monospace";
        ctx.fillText(sub.sublabel, sx, sy + subRadius + 16);
      }
      ctx.restore();
    }
  }
}
