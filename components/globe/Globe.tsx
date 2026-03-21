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

// Camera starts looking at Iceland (lat ~64.5, lng ~-19)
// Convert to 3D position on a sphere of radius ~2.4
const icelandLat = 64.5;
const icelandLng = -19;
const camDist = 2.4;
const phi = (90 - icelandLat) * (Math.PI / 180);
const theta = (icelandLng + 180) * (Math.PI / 180);
const initialCamera: [number, number, number] = [
  -(camDist * Math.sin(phi) * Math.cos(theta)),
  camDist * Math.cos(phi),
  camDist * Math.sin(phi) * Math.sin(theta),
];

export function Globe({ onNodeClick }: GlobeProps) {
  return (
    <Canvas
      camera={{
        position: initialCamera,
        fov: 45,
        near: 0.1,
        far: 1000,
      }}
      style={{ background: "#0a0a0f" }}
      gl={{ antialias: true, alpha: false }}
    >
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 3, 5]} intensity={0.08} color="#4488ff" />

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
