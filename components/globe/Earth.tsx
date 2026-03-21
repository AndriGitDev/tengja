"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

// Convert GeoJSON coordinates to 3D position on sphere
function coordTo3D(
  lng: number,
  lat: number,
  radius: number
): { x: number; y: number; z: number } {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

interface GeoFeature {
  type: string;
  properties: { name?: string; NAME?: string; ADMIN?: string };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoJSON {
  features: GeoFeature[];
}

export function Earth({ radius = 1 }: { radius?: number }) {
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);

  useEffect(() => {
    fetch("/geo/countries.json")
      .then((r) => r.json())
      .then(setGeoData)
      .catch(() => {});
  }, []);

  interface BorderLine {
    points: [number, number, number][];
    isIceland: boolean;
    isNordic: boolean;
  }

  // Build a filled mesh for Iceland
  const icelandFill = useMemo(() => {
    if (!geoData) return null;

    for (const feature of geoData.features) {
      const name =
        feature.properties.name ||
        feature.properties.NAME ||
        feature.properties.ADMIN ||
        "";
      if (name !== "Iceland") continue;

      const geom = feature.geometry;
      const allPoints: THREE.Vector3[] = [];

      const processRing = (ring: number[][]) => {
        for (const coord of ring) {
          const v = coordTo3D(coord[0], coord[1], radius * 1.002);
          allPoints.push(new THREE.Vector3(v.x, v.y, v.z));
        }
      };

      if (geom.type === "Polygon") {
        for (const ring of geom.coordinates as number[][][]) {
          processRing(ring);
        }
      } else if (geom.type === "MultiPolygon") {
        for (const polygon of geom.coordinates as number[][][][]) {
          for (const ring of polygon) {
            processRing(ring);
          }
        }
      }

      if (allPoints.length === 0) return null;

      // Create a point-cloud "fill" for Iceland
      const positions = new Float32Array(allPoints.length * 3);
      for (let i = 0; i < allPoints.length; i++) {
        positions[i * 3] = allPoints[i].x;
        positions[i * 3 + 1] = allPoints[i].y;
        positions[i * 3 + 2] = allPoints[i].z;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      return geometry;
    }
    return null;
  }, [geoData, radius]);

  const nordics = new Set(["Norway", "Sweden", "Denmark", "Finland", "Greenland", "Faroe Islands"]);
  const nearby = new Set(["United Kingdom", "Ireland", "Canada", "Netherlands", "Germany", "Belgium", "France"]);

  const borderLines = useMemo(() => {
    if (!geoData) return [];

    const lines: BorderLine[] = [];

    for (const feature of geoData.features) {
      const name =
        feature.properties.name ||
        feature.properties.NAME ||
        feature.properties.ADMIN ||
        "";
      const isIceland = name === "Iceland";
      const isNordic = nordics.has(name) || nearby.has(name);
      const geom = feature.geometry;

      const processRing = (ring: number[][]) => {
        if (ring.length < 2) return;
        const pts: [number, number, number][] = ring.map((coord) => {
          const v = coordTo3D(coord[0], coord[1], radius * 1.001);
          return [v.x, v.y, v.z];
        });
        lines.push({ points: pts, isIceland, isNordic });
      };

      if (geom.type === "Polygon") {
        for (const ring of geom.coordinates as number[][][]) {
          processRing(ring);
        }
      } else if (geom.type === "MultiPolygon") {
        for (const polygon of geom.coordinates as number[][][][]) {
          for (const ring of polygon) {
            processRing(ring);
          }
        }
      }
    }

    return lines;
  }, [geoData, radius]);

  return (
    <group>
      {/* Dark sphere base */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial color="#080810" transparent opacity={0.95} />
      </mesh>

      {/* Wireframe grid — subtle */}
      <mesh>
        <sphereGeometry args={[radius * 0.999, 36, 18]} />
        <meshBasicMaterial
          color="#1a1a2e"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Iceland fill glow */}
      {icelandFill && (
        <points geometry={icelandFill}>
          <pointsMaterial
            color="#00f0ff"
            size={0.003}
            transparent
            opacity={0.25}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Country borders */}
      {borderLines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color={
            line.isIceland
              ? "#00f0ff"
              : line.isNordic
              ? "#3a4a6a"
              : "#222238"
          }
          lineWidth={line.isIceland ? 2.0 : line.isNordic ? 0.8 : 0.5}
          transparent
          opacity={line.isIceland ? 1.0 : line.isNordic ? 0.6 : 0.35}
        />
      ))}
    </group>
  );
}
