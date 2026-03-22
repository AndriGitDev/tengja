import type {
  RipeStatAsOverview,
  RipeStatCountryResource,
  AsnRoutingSummary,
  IcelandBgpOverview,
} from "./types";
import { keyAsns, totalIcelandAsns } from "@/lib/data/iceland-asns";

const RIPESTAT_BASE = "https://stat.ripe.net/data";

export async function fetchAsOverview(
  asn: number
): Promise<RipeStatAsOverview | null> {
  try {
    const res = await fetch(
      `${RIPESTAT_BASE}/as-overview/data.json?resource=AS${asn}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCountryResources(): Promise<RipeStatCountryResource | null> {
  try {
    const res = await fetch(
      `${RIPESTAT_BASE}/country-resource-list/data.json?resource=IS`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface RoutingStatusResponse {
  data: {
    resource: string;
    announced_space?: {
      v4?: { prefixes: number };
      v6?: { prefixes: number };
    };
    observed_neighbours?: number;
    visibility?: {
      v4?: { ris_peers_seeing: number; total_ris_peers: number };
    };
  };
}

export async function fetchRoutingStatus(
  asn: number
): Promise<RoutingStatusResponse | null> {
  try {
    const res = await fetch(
      `${RIPESTAT_BASE}/routing-status/data.json?resource=AS${asn}`,
      { next: { revalidate: 7200 } } // 2 hours
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchIcelandBgpOverview(): Promise<IcelandBgpOverview> {
  // Fetch country-wide resource counts
  const countryRes = await fetchCountryResources();

  const totalAsns = countryRes?.data?.resources?.asn?.length ?? totalIcelandAsns;
  const totalIpv4 = countryRes?.data?.resources?.ipv4?.length ?? 0;
  const totalIpv6 = countryRes?.data?.resources?.ipv6?.length ?? 0;

  // Fetch routing status + AS overview for each key ASN in parallel
  const asnResults = await Promise.allSettled(
    keyAsns.map(async (ka): Promise<AsnRoutingSummary> => {
      const [routing, overview] = await Promise.all([
        fetchRoutingStatus(ka.asn),
        fetchAsOverview(ka.asn),
      ]);

      const v4Vis = routing?.data?.visibility?.v4;
      const visPercent =
        v4Vis && v4Vis.total_ris_peers > 0
          ? Math.round((v4Vis.ris_peers_seeing / v4Vis.total_ris_peers) * 100)
          : 0;

      return {
        asn: ka.asn,
        name: overview?.data?.holder ?? ka.name,
        prefixesV4: routing?.data?.announced_space?.v4?.prefixes ?? 0,
        prefixesV6: routing?.data?.announced_space?.v6?.prefixes ?? 0,
        neighbors: routing?.data?.observed_neighbours ?? 0,
        visibilityV4: visPercent,
        announced: overview?.data?.announced ?? true,
      };
    })
  );

  const asnSummaries: AsnRoutingSummary[] = asnResults
    .filter((r): r is PromiseFulfilledResult<AsnRoutingSummary> => r.status === "fulfilled")
    .map((r) => r.value);

  return {
    totalAsns,
    totalIpv4Prefixes: totalIpv4,
    totalIpv6Prefixes: totalIpv6,
    keyAsns: asnSummaries,
    lastUpdated: new Date().toISOString(),
  };
}
