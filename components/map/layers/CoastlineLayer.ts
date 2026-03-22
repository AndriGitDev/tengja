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

    // Iceland fill with glow
    if (isIceland) {
      ctx.save();
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 25 / transform.k;
      ctx.beginPath();
      path(feature as unknown as d3.GeoPermissibleObjects);
      ctx.fillStyle = "rgba(0, 240, 255, 0.08)";
      ctx.fill();
      ctx.restore();

      // Second pass for stronger inner glow
      ctx.save();
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 40 / transform.k;
      ctx.beginPath();
      path(feature as unknown as d3.GeoPermissibleObjects);
      ctx.fillStyle = "rgba(0, 240, 255, 0.04)";
      ctx.fill();
      ctx.restore();
    }

    // Nordic/nearby country fills — visible dark landmass against ocean
    if (!isIceland && isNordic) {
      ctx.beginPath();
      path(feature as unknown as d3.GeoPermissibleObjects);
      ctx.fillStyle = "rgba(20, 22, 35, 0.8)";
      ctx.fill();
    }

    // All other countries — subtle fill so they're distinguishable from ocean
    if (!isIceland && !isNordic) {
      ctx.beginPath();
      path(feature as unknown as d3.GeoPermissibleObjects);
      ctx.fillStyle = "rgba(15, 16, 28, 0.5)";
      ctx.fill();
    }

    // Borders
    ctx.beginPath();
    path(feature as unknown as d3.GeoPermissibleObjects);
    if (isIceland) {
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 2 / transform.k;
      ctx.globalAlpha = 1.0;
    } else if (isNordic) {
      // Brighter, thicker borders for cable endpoint countries
      ctx.strokeStyle = "#5a6a8a";
      ctx.lineWidth = 1.2 / transform.k;
      ctx.globalAlpha = 0.8;
    } else {
      ctx.strokeStyle = "#2a2a40";
      ctx.lineWidth = 0.6 / transform.k;
      ctx.globalAlpha = 0.4;
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  ctx.restore();
}
