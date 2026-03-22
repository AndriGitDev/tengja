import type { ZoomTier } from "./helpers";

// ── Projection ──────────────────────────────────────────────────
export const PROJECTION_CENTER: [number, number] = [-19.0, 64.5];
export const PROJECTION_SCALE = 800; // shows North Atlantic with cable context

// ── Zoom tiers ──────────────────────────────────────────────────
export const ZOOM_TIER_THRESHOLDS: Record<ZoomTier, [number, number]> = {
  1: [0.3, 8.0],     // Country overview (wider range — includes zoomed-out Atlantic view)
  2: [8.0, 30.0],    // Regional (individual nodes)
  3: [30.0, 500.0],  // Node detail (expanded sub-components)
};
export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 500;
export const TIER_TRANSITION_DURATION = 0.3; // seconds

export function getZoomTier(k: number): ZoomTier {
  if (k < ZOOM_TIER_THRESHOLDS[2][0]) return 1;
  if (k < ZOOM_TIER_THRESHOLDS[3][0]) return 2;
  return 3;
}

// ── Node styling ────────────────────────────────────────────────
export const TYPE_COLORS: Record<string, string> = {
  landing: "#00f0ff",
  datacenter: "#ffaa00",
  ixp: "#00ff88",
  probe: "#8888ff",
  pop: "#cc66ff",
};

export const TYPE_SCALE: Record<string, number> = {
  landing: 1.0,
  datacenter: 0.85,
  ixp: 1.1,
  probe: 0.7,
  pop: 0.75,
};

// ── Country classification ──────────────────────────────────────
export const NORDIC_COUNTRIES = new Set([
  "Norway", "Sweden", "Denmark", "Finland", "Greenland", "Faroe Islands",
]);
export const NEARBY_COUNTRIES = new Set([
  "United Kingdom", "Ireland", "Canada", "Netherlands", "Germany",
  "Belgium", "France",
]);

// ── Particles (per-cable scaling is in CableLayer.ts) ───────────

// ── Node expansion ──────────────────────────────────────────────
export const EXPANSION_RADIUS = 60; // px from parent center
export const EXPANSION_STAGGER = 0.05; // seconds between sub-node appearances

// ── Background ──────────────────────────────────────────────────
export const BG_COLOR = "#0a0a0f";
export const OCEAN_COLOR = "#080810";
export const VIGNETTE_COLOR = "rgba(0, 0, 0, 0.6)";
