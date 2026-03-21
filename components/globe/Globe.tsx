"use client";

import { Canvas } from "@react-three/fiber";
import { Earth } from "./Earth";
import { Atmosphere } from "./Atmosphere";
import { Cable } from "./Cable";
import { Node } from "./Node";
import { Stars } from "./Stars";
import { CameraControls } from "./CameraControls";
import { cables } from "@/lib/data/cables";
import { nodes, type NetworkNode } from "@/lib/data/nodes";

interface GlobeProps {
  onNodeClick?: (node: NetworkNode) => void;
}

export function Globe({ onNodeClick }: GlobeProps) {
  return (
    <Canvas
      camera={{
        position: [0.8, 0.8, 1.8],
        fov: 45,
        near: 0.1,
        far: 1000,
      }}
      style={{ background: "#0a0a0f" }}
      gl={{ antialias: true, alpha: false }}
    >
      <ambientLight intensity={0.1} />

      <Stars />
      <Earth />
      <Atmosphere />

      {cables.map((cable) => (
        <Cable key={cable.id} route={cable.route} color={cable.color} />
      ))}

      {nodes.map((node) => (
        <Node key={node.id} node={node} onClick={onNodeClick} />
      ))}

      <CameraControls />
    </Canvas>
  );
}
