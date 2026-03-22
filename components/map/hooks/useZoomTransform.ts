import { useEffect, useRef, useCallback, useState } from "react";
import * as d3 from "d3";
import { MIN_ZOOM, MAX_ZOOM, getZoomTier } from "../constants";
import type { ZoomTier } from "../helpers";

interface ZoomState {
  transform: d3.ZoomTransform;
  zoomTier: ZoomTier;
}

export function useZoomTransform(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onZoomChange?: (tier: ZoomTier) => void,
) {
  const [state, setState] = useState<ZoomState>({
    transform: d3.zoomIdentity,
    zoomTier: 1,
  });
  const zoomRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const staticDirtyRef = useRef(true);
  const transformRef = useRef(d3.zoomIdentity);
  const tierRef = useRef<ZoomTier>(1);

  const markDirty = useCallback(() => {
    staticDirtyRef.current = true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoom = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([MIN_ZOOM, MAX_ZOOM])
      .wheelDelta((event: WheelEvent) => {
        // Gentler zoom for finer control at high zoom levels
        return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002);
      })
      .on("zoom", (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => {
        const t = event.transform;
        transformRef.current = t;
        staticDirtyRef.current = true;

        const newTier = getZoomTier(t.k);
        const tierChanged = newTier !== tierRef.current;
        tierRef.current = newTier;

        setState({ transform: t, zoomTier: newTier });

        if (tierChanged) {
          onZoomChange?.(newTier);
        }
      });

    zoomRef.current = zoom;
    const selection = d3.select(canvas).call(zoom);

    // Disable double-click zoom (interferes with node click)
    selection.on("dblclick.zoom", null);

    return () => {
      selection.on(".zoom", null);
    };
  }, [canvasRef, onZoomChange]);

  // Programmatic zoom-to-point
  const zoomTo = useCallback(
    (x: number, y: number, k: number, duration = 750) => {
      const canvas = canvasRef.current;
      const zoom = zoomRef.current;
      if (!canvas || !zoom) return;
      d3.select(canvas)
        .transition()
        .duration(duration)
        .call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(k));
    },
    [canvasRef],
  );

  return {
    transform: state.transform,
    transformRef,
    zoomTier: state.zoomTier,
    tierRef,
    staticDirtyRef,
    markDirty,
    zoomTo,
  };
}
