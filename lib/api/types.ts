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
