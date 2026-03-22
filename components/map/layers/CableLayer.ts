import * as d3 from "d3";
import { cables } from "@/lib/data/cables";
import type { RenderContext, CableSegments } from "../helpers";
import { projectPoint, interpolateCable, isInViewport } from "../helpers";
import { PARTICLES_PER_CABLE, PARTICLE_RADIUS } from "../constants";

interface ParticleState {
  progress: Float32Array;
  speeds: Float32Array;
}

export function initParticles(): ParticleState[] {
  return cables.map(() => ({
    progress: new Float32Array(PARTICLES_PER_CABLE).map(() => Math.random()),
    speeds: new Float32Array(PARTICLES_PER_CABLE).map(
      () => 0.15 + Math.random() * 0.1,
    ),
  }));
}

export function drawRoutes(rc: RenderContext): void {
  const { ctx, projection, transform } = rc;
  const path = d3.geoPath(projection, ctx);

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  for (const cable of cables) {
    const lineString = {
      type: "LineString" as const,
      coordinates: cable.route.map((p) => [p.lng, p.lat]),
    };

    // Glow line
    ctx.save();
    ctx.shadowColor = cable.color;
    ctx.shadowBlur = 8 / transform.k;
    ctx.beginPath();
    path(lineString);
    ctx.strokeStyle = cable.color;
    ctx.lineWidth = 4 / transform.k;
    ctx.globalAlpha = 0.08;
    ctx.stroke();
    ctx.restore();

    // Main line
    ctx.beginPath();
    path(lineString);
    ctx.strokeStyle = cable.color;
    ctx.lineWidth = 1.5 / transform.k;
    ctx.globalAlpha = 0.5;
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
      ctx.shadowBlur = 6;
      ctx.globalAlpha = brightness;
      ctx.fillStyle = cable.color;
      ctx.beginPath();
      ctx.arc(px, py, PARTICLE_RADIUS, 0, Math.PI * 2);
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
    const endIdx = route.length - 1;
    const endLabel = route[endIdx].label || cable.endpoints[1];

    // Walk backward from end to find where cable exits viewport
    for (let i = projected.length - 1; i >= 1; i--) {
      const p2 = projected[i];
      const p1 = projected[i - 1];
      if (!p1 || !p2) continue;

      const inside = isInViewport(p1[0], p1[1], width, height, 0);
      const outside = !isInViewport(p2[0], p2[1], width, height, 0);

      if (inside && outside) {
        // Cable exits here — draw label at the edge
        const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
        const edgeX = Math.max(40, Math.min(width - 40, p1[0] + Math.cos(angle) * 30));
        const edgeY = Math.max(20, Math.min(height - 20, p1[1] + Math.sin(angle) * 30));

        ctx.save();
        ctx.font = "bold 10px 'Geist Mono', monospace";
        ctx.fillStyle = cable.color;
        ctx.globalAlpha = 0.7;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Arrow indicator
        const arrow = "→";
        const label = `${cable.shortName} ${arrow} ${endLabel}`;
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
