import * as d3 from "d3";
import type { RenderContext } from "../helpers";

export function draw(rc: RenderContext): void {
  const { ctx, projection, transform, zoomTier } = rc;

  const graticule = d3.geoGraticule10();
  const path = d3.geoPath(projection, ctx);

  // Alpha decreases as we zoom in
  const alphaByTier = { 1: 0.25, 2: 0.15, 3: 0.08 };
  const alpha = alphaByTier[zoomTier] ?? 0.2;

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.scale(transform.k, transform.k);

  ctx.beginPath();
  path(graticule);
  ctx.strokeStyle = `rgba(26, 26, 46, ${alpha})`;
  ctx.lineWidth = 0.5 / transform.k;
  ctx.stroke();

  ctx.restore();
}
