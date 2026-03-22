export interface RipeProbe {
  id: number;
  latitude: number;
  longitude: number;
  status: { id: number; name: string };
  status_since: number;
  address_v4: string | null;
  asn_v4: number | null;
  country_code: string;
  description: string;
  is_anchor: boolean;
  first_connected: number;
  total_uptime: number;
}

export interface RipeProbeResponse {
  count: number;
  results: RipeProbe[];
}

export interface ProbeSummary {
  id: number;
  description: string;
  status: string;
  statusSince: string;
  addressV4: string | null;
  asn: number | null;
  isAnchor: boolean;
  uptimeDays: number;
}

export interface ProbeWithMeasurements extends ProbeSummary {
  pingRtt: { avg: number; min: number; max: number } | null;
  dnsRtt: number | null;
  lastMeasurement: string | null;
}

export interface RipeStatAsOverview {
  data: {
    resource: string;
    type: string;
    block: { resource: string; name: string; desc: string };
    holder: string;
    announced: boolean;
  };
}

export interface RipeStatCountryResource {
  data: {
    resources: {
      asn: string[];
      ipv4: string[];
      ipv6: string[];
    };
  };
}

// === PeeringDB Types ===

export interface PeeringDbNetIxLan {
  id: number;
  net_id: number;
  ix_id: number;
  name: string;
  asn: number;
  speed: number; // Port speed in Mbps (e.g. 100000 = 100G)
  ipaddr4: string | null;
  ipaddr6: string | null;
  is_rs_peer: boolean;
  operational: boolean;
}

export interface RixMemberSummary {
  asn: number;
  name: string;
  totalSpeedMbps: number;
  portCount: number;
  speedLabel: string; // e.g. "2×100G"
  hasIpv4: boolean;
  hasIpv6: boolean;
  isRsPeer: boolean;
}

export interface RixSummary {
  members: RixMemberSummary[];
  totalCapacityGbps: number;
  uniqueAsnCount: number;
  totalPortCount: number;
  lastUpdated: string;
}

// === RIPEstat Routing Status Types ===

export interface AsnRoutingSummary {
  asn: number;
  name: string;
  prefixesV4: number;
  prefixesV6: number;
  neighbors: number;
  visibilityV4: number; // percentage 0-100
  announced: boolean;
}

export interface IcelandBgpOverview {
  totalAsns: number;
  totalIpv4Prefixes: number;
  totalIpv6Prefixes: number;
  keyAsns: AsnRoutingSummary[];
  lastUpdated: string;
}

// === DNS Root Latency Types ===

export interface DnsRootServer {
  letter: string;
  name: string;
  operator: string;
  ipv4: string;
  measurementId: number; // RIPE Atlas built-in measurement ID
}

export interface DnsRootLatencySummary {
  rootServer: string; // letter
  serverName: string;
  operator: string;
  avgRtt: number;
  minRtt: number;
  maxRtt: number;
  probeCount: number;
}
