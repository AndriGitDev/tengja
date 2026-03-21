import { RipeProbe, RipeProbeResponse } from "./types";

const ATLAS_BASE = "https://atlas.ripe.net/api/v2";

export async function fetchIcelandProbes(): Promise<RipeProbe[]> {
  try {
    const res = await fetch(
      `${ATLAS_BASE}/probes/?country_code=IS&status=1&page_size=100`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data: RipeProbeResponse = await res.json();
    return data.results;
  } catch {
    return [];
  }
}
