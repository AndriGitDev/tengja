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
    float innerGlow = pow(rim, 2.0);
    float outerGlow = pow(rim, 4.0);
    vec3 innerColor = vec3(0.0, 0.35, 0.8);
    vec3 outerColor = vec3(0.0, 0.7, 1.0);
    vec3 color = mix(innerColor, outerColor, outerGlow);
    float alpha = innerGlow * 0.25 + outerGlow * 0.4;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function Atmosphere({ radius = 1.025 }: { radius?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 64, 64]} />
    </mesh>
  );
}
