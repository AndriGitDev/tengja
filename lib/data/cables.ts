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
      // Landing station — exact node coordinate
      { lat: 63.533, lng: -20.215, label: "Landeyjar" },
      // Along south coast, staying offshore
      { lat: 63.45, lng: -19.8 },
      { lat: 63.35, lng: -19.2 },
      { lat: 63.30, lng: -18.5 },
      { lat: 63.28, lng: -18.0 },
      // Past Vestmannaeyjar, heading SE
      { lat: 63.15, lng: -17.0 },
      { lat: 63.0, lng: -15.5 },
      // Open ocean
      { lat: 62.7, lng: -13.0 },
      { lat: 62.5, lng: -12.0 },
      { lat: 62.0, lng: -9.0 },
      { lat: 61.5, lng: -6.0 },
      // Past Faroes
      { lat: 60.5, lng: -3.0 },
      { lat: 59.5, lng: -1.0 },
      // North Sea
      { lat: 58.5, lng: 1.5 },
      { lat: 57.5, lng: 4.0 },
      { lat: 56.5, lng: 6.0 },
      { lat: 55.8, lng: 7.5 },
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
      // Landing station — exact node coordinate
      { lat: 65.259, lng: -14.01, label: "Seyðisfjörður" },
      // Out of the fjord heading east
      { lat: 65.20, lng: -13.6 },
      { lat: 65.10, lng: -13.2 },
      // Southeast along east coast offshore
      { lat: 64.8, lng: -12.5 },
      { lat: 64.5, lng: -12.0 },
      // Open ocean heading toward Faroes
      { lat: 64.0, lng: -10.5 },
      { lat: 63.5, lng: -9.0 },
      { lat: 63.0, lng: -8.0 },
      // Faroe Islands branching unit
      { lat: 62.0, lng: -6.87, label: "Funningsfjørður, FO" },
      // South toward Scotland
      { lat: 61.5, lng: -6.0 },
      { lat: 61.0, lng: -5.0 },
      { lat: 60.2, lng: -4.3 },
      { lat: 59.5, lng: -4.0 },
      { lat: 59.0, lng: -3.7 },
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
      // Landing station — exact node coordinate
      { lat: 63.533, lng: -20.215, label: "Landeyjar" },
      // Along south coast heading west
      { lat: 63.50, lng: -20.5 },
      { lat: 63.45, lng: -21.0 },
      { lat: 63.35, lng: -21.8 },
      // Past Reykjanes peninsula
      { lat: 63.20, lng: -22.5 },
      { lat: 63.10, lng: -23.2 },
      { lat: 63.0, lng: -24.0 },
      // Open ocean toward Greenland
      { lat: 62.5, lng: -27.0 },
      { lat: 62.0, lng: -30.0 },
      { lat: 61.0, lng: -33.0 },
      { lat: 60.5, lng: -36.0 },
      { lat: 60.0, lng: -39.0 },
      { lat: 59.5, lng: -42.0 },
      // Cape Farewell
      { lat: 59.7, lng: -44.0, label: "Cape Farewell" },
      // Up Greenland west coast
      { lat: 60.5, lng: -47.0 },
      { lat: 61.5, lng: -48.5 },
      { lat: 62.0, lng: -49.5 },
      { lat: 63.0, lng: -50.5 },
      { lat: 64.17, lng: -51.74, label: "Nuuk" },
      // South from Nuuk toward Canada
      { lat: 63.0, lng: -52.5 },
      { lat: 62.0, lng: -53.0 },
      { lat: 60.5, lng: -54.0 },
      { lat: 59.5, lng: -55.0 },
      { lat: 57.5, lng: -56.5 },
      { lat: 55.0, lng: -57.5 },
      { lat: 52.0, lng: -58.5 },
      { lat: 50.0, lng: -59.5 },
      { lat: 48.0, lng: -60.5 },
      { lat: 46.0, lng: -61.0 },
      { lat: 44.65, lng: -63.57, label: "Halifax" },
    ],
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
    route: [
      // Landing station — exact node coordinate
      { lat: 63.856, lng: -21.383, label: "Þorlákshöfn" },
      // Offshore heading south from Reykjanes
      { lat: 63.7, lng: -21.2 },
      { lat: 63.5, lng: -21.0 },
      { lat: 63.3, lng: -20.5 },
      { lat: 63.2, lng: -20.0 },
      // Open ocean heading SSE
      { lat: 63.0, lng: -19.2 },
      { lat: 62.7, lng: -18.0 },
      { lat: 62.5, lng: -17.0 },
      { lat: 62.0, lng: -15.5 },
      { lat: 61.5, lng: -14.0 },
      // Passing east of Rockall
      { lat: 60.5, lng: -13.0 },
      { lat: 60.0, lng: -12.0 },
      { lat: 59.0, lng: -11.8 },
      { lat: 58.5, lng: -11.5 },
      { lat: 57.5, lng: -11.2 },
      { lat: 57.0, lng: -11.0 },
      // Approaching Ireland
      { lat: 56.0, lng: -10.8 },
      { lat: 55.5, lng: -10.5 },
      { lat: 54.5, lng: -10.2 },
      { lat: 54.0, lng: -10.0 },
      { lat: 53.5, lng: -9.5 },
      { lat: 53.27, lng: -9.05, label: "Galway" },
    ],
  },
];
