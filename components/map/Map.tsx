"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { cables } from "@/lib/data/cables";
import { nodes, type NetworkNode } from "@/lib/data/nodes";

interface MapProps {
  onNodeClick?: (node: NetworkNode) => void;
}

const typeColors: Record<string, string> = {
  landing: "#00f0ff",
  datacenter: "#ffaa00",
  ixp: "#00ff88",
  probe: "#8888ff",
};

const typeScale: Record<string, number> = {
  landing: 1.0,
  datacenter: 0.85,
  ixp: 1.1,
  probe: 0.7,
};

const nordics = new Set([
  "Norway",
  "Sweden",
  "Denmark",
  "Finland",
  "Greenland",
  "Faroe Islands",
]);
const nearby = new Set([
  "United Kingdom",
  "Ireland",
  "Canada",
  "Netherlands",
  "Germany",
  "Belgium",
  "France",
]);

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  offset: number;
}

interface ParticleState {
  progress: Float32Array;
  speeds: Float32Array;
}

interface GeoFeature {
  type: string;
  properties: { name?: string; NAME?: string; ADMIN?: string };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJSON {
  type: string;
  features: GeoFeature[];
}

export function Map({ onNodeClick }: MapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const projectionRef = useRef(
    d3
      .geoOrthographic()
      .rotate([19, -64.5, 0])
      .scale(400)
      .clipAngle(90)
  );
  const scaleRef = useRef(400);
  const rotationRef = useRef<[number, number, number]>([19, -64.5, 0]);
  const animFrameRef = useRef<number>(0);
  const geoDataRef = useRef<GeoJSON | null>(null);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<ParticleState[]>([]);
  const lastTimeRef = useRef(0);
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });
  const hoveredNodeRef = useRef<string | null>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const staticDirtyRef = useRef(true);
  const sizeRef = useRef({ width: 0, height: 0 });

  const [tooltip, setTooltip] = useState<{
    node: NetworkNode;
    x: number;
    y: number;
  } | null>(null);

  // Pre-compute cable segment data for particle interpolation
  const cableSegmentsRef = useRef(
    cables.map((cable) => {
      const segments: {
        from: [number, number];
        to: [number, number];
        dist: number;
      }[] = [];
      let totalDist = 0;
      for (let i = 0; i < cable.route.length - 1; i++) {
        const from: [number, number] = [cable.route[i].lng, cable.route[i].lat];
        const to: [number, number] = [
          cable.route[i + 1].lng,
          cable.route[i + 1].lat,
        ];
        const dist = d3.geoDistance(from, to);
        segments.push({ from, to, dist });
        totalDist += dist;
      }
      return { segments, totalDist };
    })
  );

  // Initialize particles
  useEffect(() => {
    particlesRef.current = cables.map(() => ({
      progress: new Float32Array(50).map(() => Math.random()),
      speeds: new Float32Array(50).map(() => 0.15 + Math.random() * 0.1),
    }));
  }, []);

  // Initialize stars
  useEffect(() => {
    starsRef.current = Array.from({ length: 800 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: 0.5 + Math.random() * 1.5,
      alpha: 0.2 + Math.random() * 0.6,
      speed: 0.5 + Math.random() * 2,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  const getNodeName = useCallback((feature: GeoFeature): string => {
    return (
      feature.properties.name ||
      feature.properties.NAME ||
      feature.properties.ADMIN ||
      ""
    );
  }, []);

  // Find node under cursor
  const hitTestNode = useCallback(
    (mx: number, my: number): NetworkNode | null => {
      const projection = projectionRef.current;
      const center = projection.rotate();
      const centerCoord: [number, number] = [-center[0], -center[1]];

      for (const node of nodes) {
        const coord: [number, number] = [node.lng, node.lat];
        if (d3.geoDistance(coord, centerCoord) >= Math.PI / 2) continue;
        const projected = projection(coord);
        if (!projected) continue;
        const dx = mx - projected[0];
        const dy = my - projected[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 14 * (typeScale[node.type] || 1)) return node;
      }
      return null;
    },
    []
  );

  // Interpolate position along cable route
  const interpolateCable = useCallback(
    (
      cableIdx: number,
      t: number
    ): [number, number] | null => {
      const { segments, totalDist } = cableSegmentsRef.current[cableIdx];
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
      return last.to;
    },
    []
  );

  // Draw static layers to offscreen canvas
  const drawStatic = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const projection = projectionRef.current;
      const path = d3.geoPath(projection, ctx);
      const scale = projection.scale();
      const [cx, cy] = projection.translate();

      // Globe disc with gradient
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale);
      grad.addColorStop(0, "#0d0d18");
      grad.addColorStop(0.85, "#0a0a12");
      grad.addColorStop(1, "#080810");
      ctx.beginPath();
      ctx.arc(cx, cy, scale, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Globe edge glow
      ctx.save();
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(cx, cy, scale, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.12)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Graticule
      const graticule = d3.geoGraticule10();
      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = "rgba(26, 26, 46, 0.3)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Countries
      if (geoDataRef.current) {
        for (const feature of geoDataRef.current.features) {
          const name = getNodeName(feature);
          const isIceland = name === "Iceland";
          const isNordic = nordics.has(name) || nearby.has(name);

          // Iceland fill with glow
          if (isIceland) {
            ctx.save();
            ctx.shadowColor = "#00f0ff";
            ctx.shadowBlur = 25;
            ctx.beginPath();
            path(feature as unknown as d3.GeoPermissibleObjects);
            ctx.fillStyle = "rgba(0, 240, 255, 0.1)";
            ctx.fill();
            ctx.restore();

            // Second pass for stronger glow
            ctx.save();
            ctx.shadowColor = "#00f0ff";
            ctx.shadowBlur = 40;
            ctx.beginPath();
            path(feature as unknown as d3.GeoPermissibleObjects);
            ctx.fillStyle = "rgba(0, 240, 255, 0.05)";
            ctx.fill();
            ctx.restore();
          }

          // Borders
          ctx.beginPath();
          path(feature as unknown as d3.GeoPermissibleObjects);
          if (isIceland) {
            ctx.strokeStyle = "#00f0ff";
            ctx.lineWidth = 2;
            ctx.globalAlpha = 1.0;
          } else if (isNordic) {
            ctx.strokeStyle = "#3a4a6a";
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = 0.6;
          } else {
            ctx.strokeStyle = "#222238";
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = 0.35;
          }
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      }

      // Cable lines (static part)
      for (const cable of cables) {
        const lineString = {
          type: "LineString" as const,
          coordinates: cable.route.map((p) => [p.lng, p.lat]),
        };

        // Glow line
        ctx.save();
        ctx.shadowColor = cable.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        path(lineString);
        ctx.strokeStyle = cable.color;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.08;
        ctx.stroke();
        ctx.restore();

        // Main line
        ctx.beginPath();
        path(lineString);
        ctx.strokeStyle = cable.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    },
    [getNodeName]
  );

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create offscreen canvas for static layers
    staticCanvasRef.current = document.createElement("canvas");

    // Fetch geo data
    fetch("/geo/countries.json")
      .then((r) => r.json())
      .then((data: GeoJSON) => {
        geoDataRef.current = data;
        staticDirtyRef.current = true;
      });

    // Resize handler
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        sizeRef.current = { width, height };

        if (staticCanvasRef.current) {
          staticCanvasRef.current.width = width * dpr;
          staticCanvasRef.current.height = height * dpr;
        }

        projectionRef.current.translate([width / 2, height / 2]);

        // Scale based on container size
        const baseScale = Math.min(width, height) * 0.55;
        scaleRef.current = baseScale;
        projectionRef.current.scale(baseScale);

        staticDirtyRef.current = true;
      }
    });
    observer.observe(container);

    // Interaction handlers
    const onPointerDown = (e: PointerEvent) => {
      dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (dragRef.current.active) {
        const dx = e.clientX - dragRef.current.lastX;
        const dy = e.clientY - dragRef.current.lastY;
        const [lambda, phi, gamma] = rotationRef.current;
        const sensitivity = 0.3;
        rotationRef.current = [
          lambda - dx * sensitivity,
          Math.max(-89, Math.min(89, phi + dy * sensitivity)),
          gamma,
        ];
        projectionRef.current.rotate(rotationRef.current);
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        staticDirtyRef.current = true;
      }

      // Hit test for hover
      const hitNode = hitTestNode(mx, my);
      const hitId = hitNode?.id ?? null;
      if (hitId !== hoveredNodeRef.current) {
        hoveredNodeRef.current = hitId;
        canvas.style.cursor = hitNode ? "pointer" : "default";
        setTooltip(
          hitNode ? { node: hitNode, x: e.clientX - rect.left, y: e.clientY - rect.top } : null
        );
      }
    };

    const onPointerUp = () => {
      dragRef.current.active = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hitNode = hitTestNode(mx, my);
      if (hitNode) onNodeClick?.(hitNode);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { width, height } = sizeRef.current;
      const minScale = Math.min(width, height) * 0.15;
      const maxScale = Math.min(width, height) * 5;
      scaleRef.current = Math.max(
        minScale,
        Math.min(maxScale, scaleRef.current * (1 - e.deltaY * 0.001))
      );
      projectionRef.current.scale(scaleRef.current);
      staticDirtyRef.current = true;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // Animation loop
    const draw = (time: number) => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = sizeRef.current;
      if (width === 0 || height === 0) {
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const delta = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = time;

      const projection = projectionRef.current;

      // Re-render static layers if dirty
      if (staticDirtyRef.current && staticCanvasRef.current) {
        const sctx = staticCanvasRef.current.getContext("2d");
        if (sctx) {
          sctx.save();
          sctx.scale(dpr, dpr);
          sctx.clearRect(0, 0, width, height);
          drawStatic(sctx, width, height);
          sctx.restore();
        }
        staticDirtyRef.current = false;
      }

      // Clear main canvas
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, width, height);

      // Stars
      const stars = starsRef.current;
      for (const star of stars) {
        const twinkle =
          star.alpha * (0.7 + 0.3 * Math.sin(time * 0.001 * star.speed + star.offset));
        ctx.fillStyle = `rgba(200, 210, 255, ${twinkle})`;
        ctx.fillRect(star.x * width, star.y * height, star.size, star.size);
      }

      // Composite static layers
      if (staticCanvasRef.current) {
        ctx.drawImage(staticCanvasRef.current, 0, 0, width, height);
      }

      // Animated cable particles
      const center = projection.rotate();
      const centerCoord: [number, number] = [-center[0], -center[1]];

      for (let ci = 0; ci < cables.length; ci++) {
        const cable = cables[ci];
        const state = particlesRef.current[ci];
        if (!state) continue;

        for (let i = 0; i < state.progress.length; i++) {
          state.progress[i] = (state.progress[i] + delta * state.speeds[i]) % 1;
          const coord = interpolateCable(ci, state.progress[i]);
          if (!coord) continue;

          // Check if visible on this hemisphere
          if (d3.geoDistance(coord, centerCoord) >= Math.PI / 2) continue;

          const projected = projection(coord);
          if (!projected) continue;

          const brightness = 0.3 + Math.sin(state.progress[i] * Math.PI) * 0.7;

          ctx.save();
          ctx.shadowColor = cable.color;
          ctx.shadowBlur = 6;
          ctx.globalAlpha = brightness;
          ctx.fillStyle = cable.color;
          ctx.beginPath();
          ctx.arc(projected[0], projected[1], 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const coord: [number, number] = [node.lng, node.lat];
        if (d3.geoDistance(coord, centerCoord) >= Math.PI / 2) continue;

        const projected = projection(coord);
        if (!projected) continue;

        const [nx, ny] = projected;
        const color = typeColors[node.type] || "#ffffff";
        const scale = typeScale[node.type] || 1.0;
        const isHovered = hoveredNodeRef.current === node.id;
        const t = time * 0.001;

        // Glow disc
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        const glowAlpha = isHovered ? 0.5 : 0.15 + Math.sin(t * 2) * 0.1;
        ctx.globalAlpha = glowAlpha;
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
        ctx.globalAlpha = isHovered ? 0.7 : 0.35;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = t * -20;
        ctx.beginPath();
        ctx.arc(nx, ny, outerRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Inner ring (counter-rotating, hexagonal dashes)
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = isHovered ? 0.9 : 0.5;
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
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(nx, ny, 5 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Core white dot
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Atmosphere rim glow
      const [acx, acy] = projection.translate();
      const aScale = projection.scale();
      const atmosGrad = ctx.createRadialGradient(
        acx,
        acy,
        aScale * 0.92,
        acx,
        acy,
        aScale * 1.08
      );
      atmosGrad.addColorStop(0, "rgba(0, 240, 255, 0)");
      atmosGrad.addColorStop(0.5, "rgba(0, 240, 255, 0.04)");
      atmosGrad.addColorStop(0.8, "rgba(0, 240, 255, 0.02)");
      atmosGrad.addColorStop(1, "rgba(0, 240, 255, 0)");
      ctx.fillStyle = atmosGrad;
      ctx.beginPath();
      ctx.arc(acx, acy, aScale * 1.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [drawStatic, hitTestNode, interpolateCable, onNodeClick]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ background: "#0a0a0f" }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 bg-[var(--noc-surface)]/95 backdrop-blur-md border border-[var(--noc-border)] rounded px-2.5 py-1.5 whitespace-nowrap shadow-lg"
          style={{ left: tooltip.x + 15, top: tooltip.y - 10 }}
        >
          <div
            className="font-mono text-[11px] font-semibold"
            style={{ color: typeColors[tooltip.node.type] }}
          >
            {tooltip.node.name}
          </div>
          <div className="font-mono text-[9px] text-[var(--noc-text-dim)] mt-0.5 uppercase tracking-wider">
            {tooltip.node.type}
          </div>
        </div>
      )}
    </div>
  );
}
