import * as d3 from "d3";
import type { RenderContext, GeoJSON } from "../helpers";
import { getFeatureName } from "../helpers";
import { NORDIC_COUNTRIES, NEARBY_COUNTRIES } from "../constants";

export function draw(rc: RenderContext, geoData: GeoJSON | null): void {
  if (!geoData) return;
  const { ctx, projection, transform, zoomTier } = rc;
  const path = d3.geoPath(projection, ctx);

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  for (const feature of geoData.features) {
    const name = getFeatureName(feature);
    const isIceland = name === "Iceland";
    const isNordic = NORDIC_COUNTRIES.has(name) || NEARBY_COUNTRIES.has(name);

    // Skip far-away countries at high zoom
    if (zoomTier === 3 && !isIceland && !isNordic) continue;

    // ── Fills ──────────────────────────────────────────────────
    if (isIceland) {
      // Iceland: dark fill + cyan glow
      ctx.save();
      ctx.beginPath();
      path(feature as unknown as d3.GeoPermissibleObjects);
      ctx.fillStyle = "#101828";
      ctx.fill();
      ctx.restore();

      // Glow pass
      ctx.save();
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 20 / transform.k;
      ctx.beginPath();
      path(feature as unknown as d3.GeoPermissibleObjects);
      ctx.fillStyle = "rgba(0, 240, 255, 0.12)";
      ctx.fill();
      ctx.restore();
    } else if (isNordic) {
      // Nordic/nearby: visible dark landmass
      ctx.beginPath();
      path(feature as unknown as d3.GeoPermissibleObjects);
      ctx.fillStyle = "#0f1320";
      ctx.fill();
    } else {
      // Other countries: subtle but present
      ctx.beginPath();
      path(feature as unknown as d3.GeoPermissibleObjects);
      ctx.fillStyle = "#0c0f1a";
      ctx.fill();
    }

    // ── Borders ────────────────────────────────────────────────
    ctx.beginPath();
    path(feature as unknown as d3.GeoPermissibleObjects);
    if (isIceland) {
      ctx.save();
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 8 / transform.k;
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 2 / transform.k;
      ctx.globalAlpha = 1.0;
      ctx.stroke();
      ctx.restore();
    } else if (isNordic) {
      ctx.strokeStyle = "#3a5070";
      ctx.lineWidth = 1.2 / transform.k;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    } else {
      ctx.strokeStyle = "#252a3a";
      ctx.lineWidth = 0.6 / transform.k;
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  }

  ctx.restore();
}
