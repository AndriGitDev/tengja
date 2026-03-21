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

// Dynamic import for 3D globe (heavy, client-only)
const Globe = dynamic(
  () => import("@/components/globe/Globe").then((m) => m.Globe),
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

      {/* 3D Globe fills the viewport */}
      <div className="absolute inset-0">
        <Globe onNodeClick={handleNodeClick} />
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
