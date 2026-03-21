export type SourceType = "live" | "static" | "simulated";

export interface DataSource {
  name: string;
  url?: string;
  type: SourceType;
  description: string;
}

export const dataSources: DataSource[] = [
  {
    name: "RIPE Atlas",
    url: "https://atlas.ripe.net/api/v2/probes/?country_code=IS",
    type: "live",
    description: "16 network probes across Iceland — connectivity and latency",
  },
  {
    name: "RIPEstat",
    url: "https://stat.ripe.net/data/country-resource-list/data.json?resource=IS",
    type: "live",
    description: "Iceland ASN registry, IP allocations, and routing data",
  },
  {
    name: "RIPEstat AS Overview",
    url: "https://stat.ripe.net/data/as-overview/data.json?resource=AS44735",
    type: "live",
    description: "NOVA (AS44735) autonomous system overview and routing",
  },
  {
    name: "SubmarineCableMap",
    url: "https://www.submarinecablemap.com",
    type: "static",
    description: "Cable routes, capacities, and landing points (DANICE, FARICE-1, Greenland Connect)",
  },
  {
    name: "Múli-IXP (ixp.c.is)",
    url: "https://ixp.c.is",
    type: "static",
    description: "Iceland's Internet Exchange — 6 members, peering data",
  },
  {
    name: "Cable throughput",
    type: "simulated",
    description: "Simulated bandwidth utilization with time-of-day curves and micro-events",
  },
  {
    name: "Latency metrics",
    type: "simulated",
    description: "Simulated RTT based on cable distances — Reykjavík→London ~30ms, →Copenhagen ~40ms",
  },
  {
    name: "Traffic counters",
    type: "simulated",
    description: "Packets/sec and DNS queries scaled for Iceland's ~380k population",
  },
];
