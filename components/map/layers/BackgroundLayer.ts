import type { RenderContext } from "../helpers";
import { BG_COLOR, OCEAN_COLOR } from "../constants";

export function drawBackground(rc: RenderContext): void {
  const { ctx, width, height } = rc;

  // Dark ocean fill
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, width, height);

  // Subtle radial vignette
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  const grad = ctx.createRadialGradient(cx, cy, maxR * 0.3, cx, cy, maxR);
  grad.addColorStop(0, OCEAN_COLOR);
  grad.addColorStop(1, "rgba(0, 0, 0, 0.5)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

export function drawOverlay(rc: RenderContext): void {
  const { ctx, width, height } = rc;

  // Subtle scanline effect
  ctx.save();
  ctx.globalAlpha = 0.015;
  const scanHeight = 2;
  ctx.fillStyle = "#00f0ff";
  for (let y = 0; y < height; y += scanHeight * 2) {
    ctx.fillRect(0, y, width, scanHeight);
  }
  ctx.restore();

  // Edge vignette — very subtle so it doesn't hide countries at edges
  ctx.save();
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy);
  const vignette = ctx.createRadialGradient(cx, cy, maxR * 0.7, cx, cy, maxR);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.15)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
