export interface CablePoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface Cable {
  id: string;
  name: string;
  shortName: string;
  color: string;
  lengthKm: number;
  capacityLabel: string;
  capacityTbps: number;
  owner: string;
  yearLit: number;
  route: CablePoint[];
  endpoints: [string, string];
}

export const cables: Cable[] = [
  {
    id: "danice",
    name: "DANICE",
    shortName: "DANICE",
    color: "#00f0ff",
    lengthKm: 2304,
    capacityLabel: "5.5 Tbps",
    capacityTbps: 5.5,
    owner: "Farice / DANICE consortium",
    yearLit: 2009,
    endpoints: ["Landeyjar, IS", "Blaabjerg, DK"],
    route: [
      { lat: 63.53, lng: -20.27, label: "Landeyjar" },
      { lat: 63.3, lng: -18.0 },
      { lat: 62.5, lng: -12.0 },
      { lat: 61.5, lng: -6.0 },
      { lat: 59.5, lng: -1.0 },
      { lat: 57.5, lng: 4.0 },
      { lat: 55.6, lng: 6.8 },
      { lat: 55.55, lng: 8.13, label: "Blaabjerg" },
    ],
  },
  {
    id: "farice1",
    name: "FARICE-1",
    shortName: "FARICE-1",
    color: "#ffaa00",
    lengthKm: 1205,
    capacityLabel: "40 Gbps",
    capacityTbps: 0.04,
    owner: "Farice ehf.",
    yearLit: 2004,
    endpoints: ["Seyðisfjörður, IS", "Dunnet Bay, UK"],
    route: [
      { lat: 65.26, lng: -14.0, label: "Seyðisfjörður" },
      { lat: 64.5, lng: -12.0 },
      { lat: 63.0, lng: -8.0 },
      { lat: 62.0, lng: -6.87, label: "Funningsfjørður, FO" },
      { lat: 61.0, lng: -5.0 },
      { lat: 59.5, lng: -4.0 },
      { lat: 58.6, lng: -3.42, label: "Dunnet Bay" },
    ],
  },
  {
    id: "greenland-connect",
    name: "Greenland Connect",
    shortName: "GREENLAND CON.",
    color: "#00ff88",
    lengthKm: 4580,
    capacityLabel: "23 Gbps",
    capacityTbps: 0.023,
    owner: "Tele Greenland / TUSASS",
    yearLit: 2009,
    endpoints: ["Landeyjar, IS", "Nuuk → Halifax"],
    route: [
      { lat: 63.53, lng: -20.27, label: "Landeyjar" },
      { lat: 63.8, lng: -24.0 },
      { lat: 64.0, lng: -30.0 },
      { lat: 64.17, lng: -38.0 },
      { lat: 64.17, lng: -45.0 },
      { lat: 64.17, lng: -51.74, label: "Nuuk" },
      { lat: 60.0, lng: -55.0 },
      { lat: 52.0, lng: -58.0 },
      { lat: 46.0, lng: -60.5 },
      { lat: 44.65, lng: -63.57, label: "Halifax" },
    ],
  },
];

// Convert lat/lng to 3D position on unit sphere
export function latLngToVector3(
  lat: number,
  lng: number,
  radius: number = 1
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}
