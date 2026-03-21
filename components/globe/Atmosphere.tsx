"use client";

import { useMemo } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vec3 viewDir = normalize(-vPosition);
    float rim = 1.0 - max(0.0, dot(viewDir, vNormal));
    rim = pow(rim, 3.0);
    vec3 color = mix(vec3(0.0, 0.4, 1.0), vec3(0.3, 0.8, 1.0), rim);
    gl_FragColor = vec4(color, rim * 0.4);
  }
`;

export function Atmosphere({ radius = 1.02 }: { radius?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 64, 64]} />
    </mesh>
  );
}
