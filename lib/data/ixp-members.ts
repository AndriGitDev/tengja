export interface IxpMember {
  name: string;
  asn: number;
  speed: string;
  speedGbps: number;
}

export const ixpMembers: IxpMember[] = [
  { name: "NOVA", asn: 44735, speed: "100G", speedGbps: 100 },
  { name: "Síminn", asn: 6677, speed: "100G", speedGbps: 100 },
  { name: "Hringdu", asn: 51896, speed: "100G", speedGbps: 100 },
  { name: "Ljósleiðarinn", asn: 12969, speed: "2×100G", speedGbps: 200 },
  { name: "SYN/CDN", asn: 12969, speed: "40G", speedGbps: 40 },
  { name: "RÚV", asn: 211589, speed: "3×100G", speedGbps: 300 },
];

export const totalIxpCapacityGbps = ixpMembers.reduce(
  (sum, m) => sum + m.speedGbps,
  0
);
