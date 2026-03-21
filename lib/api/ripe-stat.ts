import { RipeStatAsOverview, RipeStatCountryResource } from "./types";

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
