"use client";

import { OrbitControls } from "@react-three/drei";

export function CameraControls() {
  return (
    <OrbitControls
      enablePan={false}
      enableZoom={true}
      minDistance={1.15}
      maxDistance={4}
    />
  );
}
