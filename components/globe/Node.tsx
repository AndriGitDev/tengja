"use client";

import { useRef, useState, useMemo } from "react";
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

const typeScale: Record<string, number> = {
  landing: 1.0,
  datacenter: 0.85,
  ixp: 1.1,
  probe: 0.7,
};

export function Node({ node, onClick }: NodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHovered] = useState(false);

  const position = latLngToVector3(node.lat, node.lng, 1.012);
  const color = typeColors[node.type] || "#ffffff";
  const scale = typeScale[node.type] || 1.0;

  // Compute a quaternion to orient the node to face outward from globe center
  const quaternion = useMemo(() => {
    const pos = new THREE.Vector3(...position);
    const up = pos.clone().normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), up);
    return q;
  }, [position]);

  useFrame((state, delta) => {
    pulseRef.current += delta;
    const t = pulseRef.current;

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.4;
      const pulseScale = hovered ? 1.6 : 1.0 + Math.sin(t * 1.5) * 0.15;
      outerRingRef.current.scale.setScalar(pulseScale);
    }

    if (innerRingRef.current) {
      innerRingRef.current.rotation.z -= delta * 0.8;
    }

    if (glowRef.current) {
      const glowPulse = 0.4 + Math.sin(t * 2) * 0.2;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = hovered
        ? 0.6
        : glowPulse;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      quaternion={quaternion}
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
      {/* Soft glow disc behind the node */}
      <mesh ref={glowRef} scale={scale}>
        <circleGeometry args={[0.025, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Core dot — brighter, larger */}
      <mesh scale={scale}>
        <circleGeometry args={[0.007, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Core colored ring */}
      <mesh scale={scale}>
        <ringGeometry args={[0.006, 0.009, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner rotating ring */}
      <mesh ref={innerRingRef} scale={scale}>
        <ringGeometry args={[0.013, 0.015, 6]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.9 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer rotating ring */}
      <mesh ref={outerRingRef} scale={scale}>
        <ringGeometry args={[0.019, 0.021, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.7 : 0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Label on hover */}
      {hovered && (
        <Html
          position={[0.03, 0.03, 0]}
          style={{ pointerEvents: "none" }}
          zIndexRange={[50, 0]}
        >
          <div className="bg-[var(--noc-surface)]/95 backdrop-blur-md border border-[var(--noc-border)] rounded px-2.5 py-1.5 whitespace-nowrap shadow-lg">
            <div className="font-mono text-[11px] font-semibold" style={{ color }}>
              {node.name}
            </div>
            <div className="font-mono text-[9px] text-[var(--noc-text-dim)] mt-0.5 uppercase tracking-wider">
              {node.type}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
