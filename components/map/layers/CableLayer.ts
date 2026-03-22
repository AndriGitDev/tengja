import * as d3 from "d3";
import { cables } from "@/lib/data/cables";
import type { RenderContext, CableSegments } from "../helpers";
import { projectPoint, interpolateCable, isInViewport } from "../helpers";

interface ParticleState {
  progress: Float32Array;
  speeds: Float32Array;
}

// ── Capacity-based visual scaling ───────────────────────────────
// Cables range from 0.023 Tbps (Greenland Connect) to 100 Tbps (IRIS).
// Use log scale to map this to visual properties.
function capacityScale(tbps: number): number {
  // log10(0.023)≈-1.6, log10(100)=2 → range of ~3.6
  // Map to 0..1
  const logMin = Math.log10(0.02);
  const logMax = Math.log10(100);
  const t = (Math.log10(Math.max(tbps, 0.01)) - logMin) / (logMax - logMin);
  return Math.max(0.15, Math.min(1, t));
}

// Pre-compute per-cable visual properties
const cableVisuals = cables.map((cable) => {
  const s = capacityScale(cable.capacityTbps);
  return {
    lineWidth: 0.8 + s * 3.0,        // 0.8px to 3.8px
    glowWidth: 2 + s * 8,             // 2px to 10px
    glowAlpha: 0.04 + s * 0.12,       // subtle to bright
    mainAlpha: 0.3 + s * 0.5,         // dim to solid
    particleCount: Math.floor(15 + s * 60), // 15 to 75
    particleSpeed: 0.08 + s * 0.15,   // slower for thin, faster for thick
    particleRadius: 1.5 + s * 2,      // 1.5px to 3.5px
  };
});

export function initParticles(): ParticleState[] {
  return cables.map((_, ci) => {
    const v = cableVisuals[ci];
    return {
      progress: new Float32Array(v.particleCount).map(() => Math.random()),
      speeds: new Float32Array(v.particleCount).map(
        () => v.particleSpeed + Math.random() * 0.08,
      ),
    };
  });
}

export function drawRoutes(rc: RenderContext): void {
  const { ctx, projection, transform } = rc;
  const path = d3.geoPath(projection, ctx);

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  for (let ci = 0; ci < cables.length; ci++) {
    const cable = cables[ci];
    const v = cableVisuals[ci];
    const lineString = {
      type: "LineString" as const,
      coordinates: cable.route.map((p) => [p.lng, p.lat]),
    };

    // Glow line — wider and brighter for higher capacity
    ctx.save();
    ctx.shadowColor = cable.color;
    ctx.shadowBlur = (v.glowWidth * 1.5) / transform.k;
    ctx.beginPath();
    path(lineString);
    ctx.strokeStyle = cable.color;
    ctx.lineWidth = v.glowWidth / transform.k;
    ctx.globalAlpha = v.glowAlpha;
    ctx.stroke();
    ctx.restore();

    // Main line — thicker for higher capacity
    ctx.beginPath();
    path(lineString);
    ctx.strokeStyle = cable.color;
    ctx.lineWidth = v.lineWidth / transform.k;
    ctx.globalAlpha = v.mainAlpha;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  ctx.restore();
}

export function drawParticles(
  rc: RenderContext,
  particles: ParticleState[],
  cableSegments: CableSegments[],
): void {
  const { ctx, projection, transform, delta, width, height } = rc;

  for (let ci = 0; ci < cables.length; ci++) {
    const cable = cables[ci];
    const state = particles[ci];
    const v = cableVisuals[ci];
    if (!state) continue;

    for (let i = 0; i < state.progress.length; i++) {
      state.progress[i] = (state.progress[i] + delta * state.speeds[i]) % 1;
      const coord = interpolateCable(cableSegments[ci], state.progress[i]);
      if (!coord) continue;

      const projected = projectPoint(projection, transform, coord);
      if (!projected) continue;
      const [px, py] = projected;

      if (!isInViewport(px, py, width, height)) continue;

      const brightness = 0.3 + Math.sin(state.progress[i] * Math.PI) * 0.7;

      ctx.save();
      ctx.shadowColor = cable.color;
      ctx.shadowBlur = 4 + v.particleRadius;
      ctx.globalAlpha = brightness * v.mainAlpha;
      ctx.fillStyle = cable.color;
      ctx.beginPath();
      ctx.arc(px, py, v.particleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

export function drawEdgeLabels(
  rc: RenderContext,
  cableSegments: CableSegments[],
): void {
  const { ctx, projection, transform, width, height, zoomTier } = rc;
  if (zoomTier > 2) return; // Only at overview/regional

  for (let ci = 0; ci < cables.length; ci++) {
    const cable = cables[ci];
    const route = cable.route;

    // Project all route points
    const projected: ([number, number] | null)[] = route.map((p) =>
      projectPoint(projection, transform, [p.lng, p.lat]),
    );

    // Find endpoint labels at viewport edges
    // Check end of cable (international endpoint)
    const endLabel = route[route.length - 1].label || cable.endpoints[1];

    // Walk backward from end to find where cable exits viewport
    for (let i = projected.length - 1; i >= 1; i--) {
      const p2 = projected[i];
      const p1 = projected[i - 1];
      if (!p1 || !p2) continue;

      const inside = isInViewport(p1[0], p1[1], width, height, 0);
      const outside = !isInViewport(p2[0], p2[1], width, height, 0);

      if (inside && outside) {
        const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
        const edgeX = Math.max(40, Math.min(width - 40, p1[0] + Math.cos(angle) * 30));
        const edgeY = Math.max(20, Math.min(height - 20, p1[1] + Math.sin(angle) * 30));

        ctx.save();
        ctx.font = "bold 10px 'Geist Mono', monospace";
        ctx.fillStyle = cable.color;
        ctx.globalAlpha = 0.7;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const label = `${cable.shortName} → ${endLabel}`;
        ctx.fillText(label, edgeX, edgeY);
        ctx.restore();
        break;
      }
    }

    // Also check start of cable (for cables that start off-screen)
    const startLabel = route[0].label || cable.endpoints[0];
    for (let i = 0; i < projected.length - 1; i++) {
      const p1 = projected[i];
      const p2 = projected[i + 1];
      if (!p1 || !p2) continue;

      const outside = !isInViewport(p1[0], p1[1], width, height, 0);
      const inside = isInViewport(p2[0], p2[1], width, height, 0);

      if (outside && inside) {
        const angle = Math.atan2(p1[1] - p2[1], p1[0] - p2[0]);
        const edgeX = Math.max(40, Math.min(width - 40, p2[0] + Math.cos(angle) * 30));
        const edgeY = Math.max(20, Math.min(height - 20, p2[1] + Math.sin(angle) * 30));

        ctx.save();
        ctx.font = "bold 10px 'Geist Mono', monospace";
        ctx.fillStyle = cable.color;
        ctx.globalAlpha = 0.7;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const label = `${startLabel} ← ${cable.shortName}`;
        ctx.fillText(label, edgeX, edgeY);
        ctx.restore();
        break;
      }
    }
  }
}
