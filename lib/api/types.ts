export interface RipeProbe {
  id: number;
  latitude: number;
  longitude: number;
  status: { id: number; name: string };
  address_v4: string | null;
  asn_v4: number | null;
  country_code: string;
  description: string;
}

export interface RipeProbeResponse {
  count: number;
  results: RipeProbe[];
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
