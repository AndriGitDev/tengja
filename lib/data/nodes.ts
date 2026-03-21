export interface NetworkNode {
  id: string;
  name: string;
  type: "landing" | "datacenter" | "ixp" | "probe";
  lat: number;
  lng: number;
  description: string;
  cables?: string[];
}

export const nodes: NetworkNode[] = [
  // Cable landing points
  {
    id: "landeyjar",
    name: "Landeyjar",
    type: "landing",
    lat: 63.53,
    lng: -20.27,
    description: "Cable landing station for DANICE and Greenland Connect",
    cables: ["danice", "greenland-connect"],
  },
  {
    id: "seydisfjordur",
    name: "Seyðisfjörður",
    type: "landing",
    lat: 65.26,
    lng: -14.0,
    description: "Cable landing station for FARICE-1",
    cables: ["farice1"],
  },
  {
    id: "blaabjerg",
    name: "Blaabjerg, Denmark",
    type: "landing",
    lat: 55.55,
    lng: 8.13,
    description: "DANICE terminus — connects to European backbone",
    cables: ["danice"],
  },
  {
    id: "dunnet",
    name: "Dunnet Bay, UK",
    type: "landing",
    lat: 58.6,
    lng: -3.42,
    description: "FARICE-1 terminus — connects to UK backbone",
    cables: ["farice1"],
  },
  {
    id: "funningsfjordur",
    name: "Funningsfjørður, Faroes",
    type: "landing",
    lat: 62.0,
    lng: -6.87,
    description: "FARICE-1 branching unit — Faroe Islands connection",
    cables: ["farice1"],
  },
  {
    id: "nuuk",
    name: "Nuuk, Greenland",
    type: "landing",
    lat: 64.17,
    lng: -51.74,
    description: "Greenland Connect mid-point — primary Greenland connectivity",
    cables: ["greenland-connect"],
  },
  {
    id: "halifax",
    name: "Halifax, Canada",
    type: "landing",
    lat: 44.65,
    lng: -63.57,
    description: "Greenland Connect terminus — North American backbone",
    cables: ["greenland-connect"],
  },
  // Data centers & IX
  {
    id: "rvk-ix",
    name: "Múli-IXP, Reykjavík",
    type: "ixp",
    lat: 64.13,
    lng: -21.9,
    description: "Iceland's Internet Exchange Point — 6 members, 100G+ capacity",
  },
  {
    id: "rvk-dc1",
    name: "Verne Global (Keflavík)",
    type: "datacenter",
    lat: 63.97,
    lng: -22.57,
    description: "Major data center campus — 100% renewable energy",
  },
  {
    id: "rvk-dc2",
    name: "atNorth (Kópavogur)",
    type: "datacenter",
    lat: 64.11,
    lng: -21.89,
    description: "Colocation and cloud services facility",
  },
];
