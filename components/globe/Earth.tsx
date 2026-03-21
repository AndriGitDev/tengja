"use client";

import { useEffect, useMemo, useState } from "react";
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
  }

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
      const geom = feature.geometry;

      const processRing = (ring: number[][]) => {
        if (ring.length < 2) return;
        const pts: [number, number, number][] = ring.map((coord) => {
          const v = coordTo3D(coord[0], coord[1], radius * 1.001);
          return [v.x, v.y, v.z];
        });
        lines.push({ points: pts, isIceland });
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

      {/* Wireframe grid */}
      <mesh>
        <sphereGeometry args={[radius * 0.999, 36, 18]} />
        <meshBasicMaterial
          color="#1a1a2e"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Country borders */}
      {borderLines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color={line.isIceland ? "#00f0ff" : "#2a2a4a"}
          lineWidth={line.isIceland ? 1.5 : 0.5}
          transparent
          opacity={line.isIceland ? 0.9 : 0.4}
        />
      ))}
    </group>
  );
}
