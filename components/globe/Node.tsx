"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { latLngToVector3 } from "@/lib/data/cables";
import type { NetworkNode } from "@/lib/data/nodes";

interface NodeProps {
  node: NetworkNode;
  onClick?: (node: NetworkNode) => void;
}

const typeColors: Record<string, string> = {
  landing: "#00f0ff",
  datacenter: "#ffaa00",
  ixp: "#00ff88",
  probe: "#8888ff",
};

export function Node({ node, onClick }: NodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const position = latLngToVector3(node.lat, node.lng, 1.01);
  const color = typeColors[node.type] || "#ffffff";

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.5;
      const scale = hovered ? 1.5 : 1.0;
      ringRef.current.scale.lerp(
        new THREE.Vector3(scale, scale, scale),
        delta * 5
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(node);
      }}
      onPointerEnter={() => {
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerLeave={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Core dot */}
      <mesh>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Pulsing ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.012, 0.015, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.8 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Label on hover */}
      {hovered && (
        <Html
          position={[0.02, 0.02, 0]}
          style={{ pointerEvents: "none" }}
          zIndexRange={[50, 0]}
        >
          <div className="bg-[var(--noc-surface)]/90 backdrop-blur-sm border border-[var(--noc-border)] rounded px-2 py-1 whitespace-nowrap">
            <span className="font-mono text-[10px]" style={{ color }}>
              {node.name}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
