"use client";

import { OrbitControls } from "@react-three/drei";

export function CameraControls() {
  return (
    <OrbitControls
      enablePan={false}
      enableZoom={true}
      minDistance={1.05}
      maxDistance={4}
    />
  );
}
