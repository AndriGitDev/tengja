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
  },
  {
    id: "iris",
    name: "IRIS",
    shortName: "IRIS",
    color: "#ff44aa",
    lengthKm: 1700,
    capacityLabel: "100 Tbps",
    capacityTbps: 100,
    owner: "Farice ehf.",
    yearLit: 2025,
    endpoints: ["Þorlákshöfn, IS", "Galway, IE"],
  },
];
