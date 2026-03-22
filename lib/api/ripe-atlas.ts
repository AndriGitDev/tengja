import type { RipeProbe, RipeProbeResponse, ProbeSummary, ProbeWithMeasurements } from "./types";

const ATLAS_BASE = "https://atlas.ripe.net/api/v2";

export async function fetchIcelandProbes(): Promise<RipeProbe[]> {
  try {
    const res = await fetch(
      `${ATLAS_BASE}/probes/?country_code=IS&status_name=Connected&page_size=100`,
    );
    if (!res.ok) return [];
    const data: RipeProbeResponse = await res.json();
    return data.results;
  } catch {
    return [];
  }
}

export function summarizeProbe(probe: RipeProbe): ProbeSummary {
  const statusSince = probe.status_since
    ? new Date(probe.status_since * 1000).toISOString()
    : "unknown";
  const uptimeDays = probe.total_uptime
    ? Math.floor(probe.total_uptime / 86400)
    : 0;

  return {
    id: probe.id,
    description: probe.description || `Probe #${probe.id}`,
    status: probe.status?.name || "Unknown",
    statusSince,
    addressV4: probe.address_v4,
    asn: probe.asn_v4,
    isAnchor: probe.is_anchor || false,
    uptimeDays,
  };
}

export async function fetchProbeMeasurements(
  probeId: number,
): Promise<{ pingRtt: { avg: number; min: number; max: number } | null; dnsRtt: number | null }> {
  try {
    // Fetch recent built-in measurements for this probe
    // We use the anchoring measurements or built-in ping to root servers
    const res = await fetch(
      `${ATLAS_BASE}/measurements/?probe_id=${probeId}&type=ping&status=2&page_size=1&sort=-start_time`,
    );
    if (!res.ok) return { pingRtt: null, dnsRtt: null };

    const data = await res.json();
    const measurement = data.results?.[0];
    if (!measurement) return { pingRtt: null, dnsRtt: null };

    // Fetch latest result for this measurement
    const resultRes = await fetch(
      `${ATLAS_BASE}/measurements/${measurement.id}/latest/?probe_ids=${probeId}`,
    );
    if (!resultRes.ok) return { pingRtt: null, dnsRtt: null };

    const results = await resultRes.json();
    const result = results?.[0];

    let pingRtt = null;
    if (result?.avg !== undefined) {
      pingRtt = {
        avg: Math.round(result.avg * 100) / 100,
        min: Math.round((result.min ?? result.avg) * 100) / 100,
        max: Math.round((result.max ?? result.avg) * 100) / 100,
      };
    }

    return { pingRtt, dnsRtt: null };
  } catch {
    return { pingRtt: null, dnsRtt: null };
  }
}

export async function fetchProbesWithMeasurements(): Promise<ProbeWithMeasurements[]> {
  const probes = await fetchIcelandProbes();
  const summaries = probes.map(summarizeProbe);

  // Fetch measurements in parallel (limit to first 10 probes to avoid rate limiting)
  const withMeasurements = await Promise.all(
    summaries.slice(0, 10).map(async (probe): Promise<ProbeWithMeasurements> => {
      const measurements = await fetchProbeMeasurements(probe.id);
      return {
        ...probe,
        ...measurements,
        lastMeasurement: new Date().toISOString(),
      };
    }),
  );

  return withMeasurements;
}
