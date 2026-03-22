"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { nodes, type NetworkNode } from "@/lib/data/nodes";
import { PROJECTION_CENTER, PROJECTION_SCALE, TYPE_COLORS } from "./constants";
import {
  hitTestNode,
  computeCableSegments,
  type GeoJSON,
  type ZoomTier,
  type RenderContext,
} from "./helpers";
import { useZoomTransform } from "./hooks/useZoomTransform";
import { useSemanticZoom } from "./hooks/useSemanticZoom";
import { useAnimationLoop } from "./hooks/useAnimationLoop";

// Layers
import { drawBackground, drawOverlay } from "./layers/BackgroundLayer";
import { draw as drawGraticule } from "./layers/GraticuleLayer";
import { draw as drawCoastline } from "./layers/CoastlineLayer";
import { drawRoutes, drawParticles, drawEdgeLabels, initParticles } from "./layers/CableLayer";
import { drawClusters, drawNodes, drawExpansions } from "./layers/NodeLayer";
import { drawClusterLabels, drawNodeLabels } from "./layers/LabelLayer";

interface MapProps {
  onNodeClick?: (node: NetworkNode) => void;
  onZoomTierChange?: (tier: ZoomTier) => void;
}

export function Map({ onNodeClick, onZoomTierChange }: MapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const geoDataRef = useRef<GeoJSON | null>(null);
  // Static canvas removed — all layers render directly each frame
  const sizeRef = useRef({ width: 0, height: 0 });
  const hoveredNodeRef = useRef<string | null>(null);

  const [tooltip, setTooltip] = useState<{
    node: NetworkNode;
    x: number;
    y: number;
  } | null>(null);

  // Projection — fixed, never changes after init
  const projectionRef = useRef(
    d3
      .geoMercator()
      .center(PROJECTION_CENTER)
      .scale(PROJECTION_SCALE)
      .translate([0, 0]), // Set properly on resize
  );

  // Pre-computed cable data
  const cableSegmentsRef = useRef(computeCableSegments());
  const particlesRef = useRef(initParticles());

  // Hooks
  const {
    transformRef,
    tierRef,
    staticDirtyRef,
    markDirty,
  } = useZoomTransform(canvasRef, onZoomTierChange);

  const semanticZoom = useSemanticZoom();

  // Fetch geo data
  useEffect(() => {
    fetch("/geo/countries.json")
      .then((r) => r.json())
      .then((data: GeoJSON) => {
        geoDataRef.current = data;
        staticDirtyRef.current = true;
      });
  }, [staticDirtyRef]);

  // Canvas setup & resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // All rendering happens directly on the main canvas each frame

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        sizeRef.current = { width, height };

        // Mark for redraw (projection translate updated)
        // staticDirtyRef no longer used but zoom hook still sets it

        // Center projection in viewport
        projectionRef.current.translate([width / 2, height / 2]);
        staticDirtyRef.current = true;
      }
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [staticDirtyRef]);

  // Pointer interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const hitNode = hitTestNode(
        mx,
        my,
        projectionRef.current,
        transformRef.current,
      );
      const hitId = hitNode?.id ?? null;

      if (hitId !== hoveredNodeRef.current) {
        hoveredNodeRef.current = hitId;
        canvas.style.cursor = hitNode ? "pointer" : "default";
        setTooltip(
          hitNode
            ? { node: hitNode, x: e.clientX - rect.left, y: e.clientY - rect.top }
            : null,
        );
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hitNode = hitTestNode(
        mx,
        my,
        projectionRef.current,
        transformRef.current,
      );
      if (hitNode) onNodeClick?.(hitNode);
    };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("click", onClick);

    return () => {
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("click", onClick);
    };
  }, [onNodeClick, transformRef]);

  // Main render loop
  useAnimationLoop(
    useCallback(
      (time: number, delta: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const { width, height } = sizeRef.current;
        if (width === 0 || height === 0) return;

        const projection = projectionRef.current;
        const transform = transformRef.current;
        const zoomTier = tierRef.current;

        // Compute semantic zoom state
        const {
          clusters,
          expandedNodeIds,
          transitionProgress,
        } = semanticZoom.update(
          zoomTier,
          delta,
          projection,
          transform,
          width,
          height,
        );

        // Build render context
        const rc: RenderContext = {
          ctx,
          projection,
          transform,
          width,
          height,
          time,
          delta,
          zoomTier,
          tierTransition: transitionProgress,
          hoveredNodeId: hoveredNodeRef.current,
          expandedNodeIds,
        };

        // Clear and draw all layers directly on main canvas
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, width, height);

        // Base layers
        drawBackground(rc);
        drawGraticule(rc);
        drawCoastline(rc, geoDataRef.current);
        drawRoutes(rc);

        // Dynamic layers
        drawParticles(rc, particlesRef.current, cableSegmentsRef.current);

        // Tier-dependent rendering
        if (zoomTier === 1) {
          const clusterAlpha = transitionProgress;
          drawClusters(rc, clusters, clusterAlpha);
          drawClusterLabels(rc, clusters, clusterAlpha);
        }

        if (zoomTier >= 2) {
          const nodeAlpha = transitionProgress;
          drawNodes(rc, nodeAlpha);
          drawNodeLabels(rc, nodeAlpha);
        }

        if (zoomTier === 3) {
          drawExpansions(rc, transitionProgress);
        }

        // Cable edge labels (tier 1 & 2)
        drawEdgeLabels(rc, cableSegmentsRef.current);

        // Scanline overlay on top
        drawOverlay(rc);

        ctx.restore();
      },
      [semanticZoom, transformRef, tierRef, staticDirtyRef],
    ),
  );

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
            style={{ color: TYPE_COLORS[tooltip.node.type] }}
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
