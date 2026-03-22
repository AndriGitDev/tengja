import { useRef, useCallback } from "react";
import { nodes } from "@/lib/data/nodes";
import { regions } from "@/lib/data/regions";
import type { ZoomTier } from "../helpers";
import { projectPoint, isInViewport } from "../helpers";
import type * as d3 from "d3";

export interface ClusterDot {
  regionId: string;
  name: string;
  nameIs: string;
  x: number;
  y: number;
  nodeCount: number;
  dominantColor: string;
}

export interface VisibleNode {
  id: string;
  x: number;
  y: number;
}

export function useSemanticZoom() {
  const prevTierRef = useRef<ZoomTier>(1);
  const transitionProgressRef = useRef(1); // 1 = fully settled

  const update = useCallback(
    (
      zoomTier: ZoomTier,
      delta: number,
      projection: d3.GeoProjection,
      transform: d3.ZoomTransform,
      width: number,
      height: number,
    ) => {
      // Track tier transitions
      if (zoomTier !== prevTierRef.current) {
        prevTierRef.current = zoomTier;
        transitionProgressRef.current = 0;
      }
      if (transitionProgressRef.current < 1) {
        transitionProgressRef.current = Math.min(
          1,
          transitionProgressRef.current + delta / 0.3,
        );
      }

      // Compute cluster dots (tier 1)
      const clusters: ClusterDot[] = [];
      if (zoomTier === 1) {
        for (const region of regions) {
          const pt = projectPoint(projection, transform, region.center);
          if (!pt) continue;
          if (!isInViewport(pt[0], pt[1], width, height)) continue;

          // Determine dominant type color
          const typeCounts: Record<string, number> = {};
          for (const nodeId of region.nodeIds) {
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
              typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
            }
          }
          let dominant = "ixp";
          let maxCount = 0;
          for (const [type, count] of Object.entries(typeCounts)) {
            if (count > maxCount) {
              maxCount = count;
              dominant = type;
            }
          }

          const colorMap: Record<string, string> = {
            landing: "#00f0ff",
            datacenter: "#ffaa00",
            ixp: "#00ff88",
            probe: "#8888ff",
            pop: "#cc66ff",
          };

          clusters.push({
            regionId: region.id,
            name: region.name,
            nameIs: region.nameIs,
            x: pt[0],
            y: pt[1],
            nodeCount: region.nodeIds.length,
            dominantColor: colorMap[dominant] || "#00f0ff",
          });
        }
      }

      // Compute visible individual nodes (tier 2+)
      const visibleNodes: VisibleNode[] = [];
      if (zoomTier >= 2) {
        for (const node of nodes) {
          const pt = projectPoint(projection, transform, [node.lng, node.lat]);
          if (!pt) continue;
          if (!isInViewport(pt[0], pt[1], width, height)) continue;
          visibleNodes.push({ id: node.id, x: pt[0], y: pt[1] });
        }
      }

      // Compute expanded nodes (tier 3) — only expand IXPs and landing stations
      // which have meaningful sub-components. Other types are too noisy.
      const expandableTypes = new Set(["ixp", "landing"]);
      const expandedNodeIds = new Set<string>();
      if (zoomTier === 3) {
        for (const vn of visibleNodes) {
          const node = nodes.find((n) => n.id === vn.id);
          if (node && expandableTypes.has(node.type)) {
            expandedNodeIds.add(vn.id);
          }
        }
      }

      return {
        clusters,
        visibleNodes,
        expandedNodeIds,
        transitionProgress: transitionProgressRef.current,
      };
    },
    [],
  );

  return { update };
}
