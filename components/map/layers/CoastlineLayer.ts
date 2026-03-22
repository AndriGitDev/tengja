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

      ctx.save();
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 40 / transform.k;
      ctx.beginPath();
      path(feature as unknown as d3.GeoPermissibleObjects);
      ctx.fillStyle = "rgba(0, 240, 255, 0.04)";
      ctx.fill();
      ctx.restore();
    }

    // Nordic/nearby countries — visible landmasses
    if (!isIceland && isNordic) {
      ctx.beginPath();
      path(feature as unknown as d3.GeoPermissibleObjects);
      ctx.fillStyle = "#1a2038";
      ctx.fill();
    }

    // All other countries
    if (!isIceland && !isNordic) {
      ctx.beginPath();
      path(feature as unknown as d3.GeoPermissibleObjects);
      ctx.fillStyle = "#141828";
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
      ctx.strokeStyle = "#506888";
      ctx.lineWidth = 1.5 / transform.k;
      ctx.globalAlpha = 1.0;
    } else {
      ctx.strokeStyle = "#303850";
      ctx.lineWidth = 0.8 / transform.k;
      ctx.globalAlpha = 0.7;
    }
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  ctx.restore();
}
