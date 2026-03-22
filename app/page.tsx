"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { TopBar } from "@/components/hud/TopBar";
import { CablePanel } from "@/components/hud/CablePanel";
import { DetailPanel } from "@/components/hud/DetailPanel";
import { MetricsTicker } from "@/components/hud/MetricsTicker";
import { SourcesDropdown } from "@/components/hud/SourcesDropdown";
import { HudFrame } from "@/components/hud/HudFrame";
import type { NetworkNode } from "@/lib/data/nodes";

// Dynamic import for 2D map (client-only, uses D3 + Canvas)
const Map = dynamic(
  () => import("@/components/map/Map").then((m) => m.Map),
  { ssr: false }
);

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<"cable" | "node" | null>(
    null
  );

  const handleCableClick = useCallback((cableId: string) => {
    setSelectedId(cableId);
    setSelectedType("cable");
  }, []);

  const handleNodeClick = useCallback((node: NetworkNode) => {
    setSelectedId(node.id);
    setSelectedType("node");
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
    setSelectedType(null);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <HudFrame />
      <TopBar />

      {/* Zoomable flat map fills the viewport */}
      <div className="absolute inset-0">
        <Map onNodeClick={handleNodeClick} />
      </div>

      {/* HUD overlays */}
      <CablePanel onCableClick={handleCableClick} />
      <DetailPanel
        selectedId={selectedId}
        type={selectedType}
        onClose={handleClose}
      />
      <MetricsTicker />
      <SourcesDropdown />
    </main>
  );
}
