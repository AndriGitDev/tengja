"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { latLngToVector3 } from "@/lib/data/cables";
import type { CablePoint } from "@/lib/data/cables";

interface CableProps {
  route: CablePoint[];
  color: string;
  particleCount?: number;
}

export function Cable({ route, color, particleCount = 40 }: CableProps) {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const progressRef = useRef<Float32Array>(
    new Float32Array(particleCount).map(() => Math.random())
  );

  const curve = useMemo(() => {
    const points = route.map((p) => {
      const [x, y, z] = latLngToVector3(p.lat, p.lng, 1.005);
      return new THREE.Vector3(x, y, z);
    });
    return new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);
  }, [route]);

  // Static cable line points
  const linePoints = useMemo(() => {
    return curve.getPoints(100).map((p) => [p.x, p.y, p.z] as [number, number, number]);
  }, [curve]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    const progress = progressRef.current;

    for (let i = 0; i < particleCount; i++) {
      progress[i] = (progress[i] + delta * 0.08) % 1;
      const point = curve.getPoint(progress[i]);

      // Slight lift above globe surface
      const dir = point.clone().normalize();
      point.add(dir.multiplyScalar(0.003));

      dummy.position.copy(point);
      const scale = 0.6 + Math.sin(progress[i] * Math.PI) * 0.4;
      dummy.scale.setScalar(scale * 0.003);
      dummy.updateMatrix();
      particlesRef.current.setMatrixAt(i, dummy.matrix);
    }
    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Cable path line */}
      <Line
        points={linePoints}
        color={color}
        lineWidth={1}
        transparent
        opacity={0.3}
      />

      {/* Flowing particles */}
      <instancedMesh
        ref={particlesRef}
        args={[undefined, undefined, particleCount]}
      >
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </instancedMesh>
    </group>
  );
}
