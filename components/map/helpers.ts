import * as d3 from "d3";
import { nodes, type NetworkNode } from "@/lib/data/nodes";
import { cables } from "@/lib/data/cables";
import { TYPE_SCALE } from "./constants";

// ── Types ───────────────────────────────────────────────────────
export type ZoomTier = 1 | 2 | 3;

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  projection: d3.GeoProjection;
  transform: d3.ZoomTransform;
  width: number;
  height: number;
  time: number;
  delta: number;
  zoomTier: ZoomTier;
  tierTransition: number; // 0-1 blend during tier changes
  hoveredNodeId: string | null;
  expandedNodeIds: Set<string>;
}

export interface GeoFeature {
  type: string;
  properties: { name?: string; NAME?: string; ADMIN?: string };
  geometry: { type: string; coordinates: number[][][] | number[][][][] };
}

export interface GeoJSON {
  type: string;
  features: GeoFeature[];
}

export interface CableSegments {
  segments: { from: [number, number]; to: [number, number]; dist: number }[];
  totalDist: number;
}

// ── Projection helpers ──────────────────────────────────────────
export function projectPoint(
  projection: d3.GeoProjection,
  transform: d3.ZoomTransform,
  coord: [number, number],
): [number, number] | null {
  const projected = projection(coord);
  if (!projected) return null;
  return [transform.applyX(projected[0]), transform.applyY(projected[1])];
}

export function isInViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  margin = 50,
): boolean {
  return x >= -margin && x <= width + margin && y >= -margin && y <= height + margin;
}

// ── Feature name extraction ─────────────────────────────────────
export function getFeatureName(feature: GeoFeature): string {
  return feature.properties.name || feature.properties.NAME || feature.properties.ADMIN || "";
}

// ── Hit testing ─────────────────────────────────────────────────
export function hitTestNode(
  mx: number,
  my: number,
  projection: d3.GeoProjection,
  transform: d3.ZoomTransform,
): NetworkNode | null {
  const k = transform.k;
  for (const node of nodes) {
    const coord: [number, number] = [node.lng, node.lat];
    const projected = projectPoint(projection, transform, coord);
    if (!projected) continue;
    const dx = mx - projected[0];
    const dy = my - projected[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    const hitRadius = 14 * (TYPE_SCALE[node.type] || 1) * Math.min(k * 0.5, 2);
    if (dist < Math.max(hitRadius, 10)) return node;
  }
  return null;
}

// ── Cable segment pre-computation ───────────────────────────────
export function computeCableSegments(): CableSegments[] {
  return cables.map((cable) => {
    const segments: { from: [number, number]; to: [number, number]; dist: number }[] = [];
    let totalDist = 0;
    for (let i = 0; i < cable.route.length - 1; i++) {
      const from: [number, number] = [cable.route[i].lng, cable.route[i].lat];
      const to: [number, number] = [cable.route[i + 1].lng, cable.route[i + 1].lat];
      const dist = d3.geoDistance(from, to);
      segments.push({ from, to, dist });
      totalDist += dist;
    }
    return { segments, totalDist };
  });
}

export function interpolateCable(
  cableSegments: CableSegments,
  t: number,
): [number, number] | null {
  const { segments, totalDist } = cableSegments;
  const targetDist = t * totalDist;
  let accumulated = 0;
  for (const seg of segments) {
    if (accumulated + seg.dist >= targetDist) {
      const segT = (targetDist - accumulated) / seg.dist;
      const interp = d3.geoInterpolate(seg.from, seg.to);
      return interp(segT);
    }
    accumulated += seg.dist;
  }
  const last = segments[segments.length - 1];
  return last?.to ?? null;
}

// ── Viewport-edge intersection for cable labels ─────────────────
export function findEdgeIntersection(
  points: [number, number][],
  width: number,
  height: number,
): { point: [number, number]; angle: number; endLabel: string } | null {
  // Walk from end of cable backward to find where it exits viewport
  for (let i = points.length - 1; i >= 1; i--) {
    const [x2, y2] = points[i];
    const [x1, y1] = points[i - 1];
    const inside1 = isInViewport(x1, y1, width, height, 0);
    const outside2 = !isInViewport(x2, y2, width, height, 0);
    if (inside1 && outside2) {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      // Clamp intersection to viewport edge
      const cx = Math.max(20, Math.min(width - 20, x1 + (x2 - x1) * 0.5));
      const cy = Math.max(20, Math.min(height - 20, y1 + (y2 - y1) * 0.5));
      return { point: [cx, cy], angle, endLabel: "" };
    }
  }
  // Also check from start
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const outside1 = !isInViewport(x1, y1, width, height, 0);
    const inside2 = isInViewport(x2, y2, width, height, 0);
    if (outside1 && inside2) {
      const angle = Math.atan2(y1 - y2, x1 - x2);
      const cx = Math.max(20, Math.min(width - 20, x2 + (x1 - x2) * 0.5));
      const cy = Math.max(20, Math.min(height - 20, y2 + (y1 - y2) * 0.5));
      return { point: [cx, cy], angle, endLabel: "" };
    }
  }
  return null;
}
