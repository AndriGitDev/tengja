export interface Region {
  id: string;
  name: string;
  nameIs: string;
  center: [number, number]; // [lng, lat]
  nodeIds: string[];
}

export const regions: Region[] = [
  {
    id: "reykjavik",
    name: "REYKJAVIK METRO",
    nameIs: "HÖFUÐBORGARSVÆÐIÐ",
    center: [-21.9, 64.12],
    nodeIds: [
      "atnorth-ice01", "borealis-rvk",
      "rix-tg", "rix-k2", "rix-mh",
      "probe-nova", "probe-siminn", "probe-rhnet", "probe-harpa",
      "siminn-hq", "mila-hq", "nova-hq", "hringdu-hq",
    ],
  },
  {
    id: "keflavik",
    name: "KEFLAVIK",
    nameIs: "KEFLAVÍK",
    center: [-22.55, 63.97],
    nodeIds: [
      "verne-global", "atnorth-ice02", "borealis-fitjar", "probe-farice",
    ],
  },
  {
    id: "south",
    name: "SOUTH COAST",
    nameIs: "SUÐURLAND",
    center: [-20.8, 63.7],
    nodeIds: ["landeyjar", "thorlakshofn"],
  },
  {
    id: "north",
    name: "NORTH",
    nameIs: "NORÐURLAND",
    center: [-19.2, 65.66],
    nodeIds: ["atnorth-ice03", "borealis-blonduos"],
  },
  {
    id: "east",
    name: "EAST",
    nameIs: "AUSTURLAND",
    center: [-14.01, 65.26],
    nodeIds: ["seydisfjordur"],
  },
];
