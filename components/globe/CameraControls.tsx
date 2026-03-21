"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export function CameraControls() {
  const controlsRef = useRef<any>(null);
  const idleTimer = useRef(0);
  const isInteracting = useRef(false);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isInteracting.current) {
      idleTimer.current = 0;
    } else {
      idleTimer.current += delta;
      // Start auto-rotate after 8 seconds of inactivity
      if (idleTimer.current > 8) {
        controlsRef.current.autoRotate = true;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minDistance={1.5}
      maxDistance={4}
      autoRotate
      autoRotateSpeed={0.15}
      onStart={() => {
        isInteracting.current = true;
        if (controlsRef.current) {
          controlsRef.current.autoRotate = false;
        }
      }}
      onEnd={() => {
        isInteracting.current = false;
      }}
    />
  );
}
