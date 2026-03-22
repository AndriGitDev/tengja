import type { DnsRootServer, DnsRootLatencySummary } from "./types";

const ATLAS_BASE = "https://atlas.ripe.net/api/v2";

// RIPE Atlas built-in ping measurements to DNS root servers (IPv4)
// These run every 240 seconds on every connected probe
export const DNS_ROOT_SERVERS: DnsRootServer[] = [
  { letter: "a", name: "a.root-servers.net", operator: "Verisign", ipv4: "198.41.0.4", measurementId: 1001 },
  { letter: "b", name: "b.root-servers.net", operator: "USC-ISI", ipv4: "199.9.14.201", measurementId: 1002 },
  { letter: "c", name: "c.root-servers.net", operator: "Cogent", ipv4: "192.33.4.12", measurementId: 1003 },
  { letter: "d", name: "d.root-servers.net", operator: "UMD", ipv4: "199.7.91.13", measurementId: 1004 },
  { letter: "e", name: "e.root-servers.net", operator: "NASA", ipv4: "192.203.230.10", measurementId: 1005 },
  { letter: "f", name: "f.root-servers.net", operator: "ISC", ipv4: "192.5.5.241", measurementId: 1006 },
  { letter: "g", name: "g.root-servers.net", operator: "DISA", ipv4: "192.112.36.4", measurementId: 1007 },
  { letter: "h", name: "h.root-servers.net", operator: "USArmy", ipv4: "198.97.190.53", measurementId: 1008 },
  { letter: "i", name: "i.root-servers.net", operator: "Netnod", ipv4: "192.36.148.17", measurementId: 1009 },
  { letter: "j", name: "j.root-servers.net", operator: "Verisign", ipv4: "192.58.128.30", measurementId: 1010 },
  { letter: "k", name: "k.root-servers.net", operator: "RIPE NCC", ipv4: "193.0.14.129", measurementId: 1001 },
  { letter: "l", name: "l.root-servers.net", operator: "ICANN", ipv4: "199.7.83.42", measurementId: 1008 },
  { letter: "m", name: "m.root-servers.net", operator: "WIDE", ipv4: "202.12.27.33", measurementId: 1006 },
];

// The actual built-in measurement IDs we verified from the API:
// 1001 = k.root-servers.net (RIPE NCC), 1004 = f.root-servers.net (ISC),
// 1005 = i.root-servers.net (Netnod), 1006 = m.root-servers.net (WIDE),
// 1008 = l.root-servers.net (ICANN), 1009 = a.root-servers.net (Verisign),
// 1010 = b.root-servers.net (USC-ISI), 1011 = c.root-servers.net (Cogent),
// 1012 = d.root-servers.net (UMD), 1013 = e.root-servers.net (NASA),
// 1015 = h.root-servers.net (USArmy), 1016 = j.root-servers.net (Verisign)
// Note: not all 13 roots have built-in measurements; g-root is often missing

// Corrected mapping based on verified API data
const VERIFIED_MEASUREMENTS: { letter: string; name: string; operator: string; measurementId: number }[] = [
  { letter: "k", name: "k.root-servers.net", operator: "RIPE NCC", measurementId: 1001 },
  { letter: "f", name: "f.root-servers.net", operator: "ISC", measurementId: 1004 },
  { letter: "i", name: "i.root-servers.net", operator: "Netnod", measurementId: 1005 },
  { letter: "m", name: "m.root-servers.net", operator: "WIDE", measurementId: 1006 },
  { letter: "l", name: "l.root-servers.net", operator: "ICANN", measurementId: 1008 },
  { letter: "a", name: "a.root-servers.net", operator: "Verisign", measurementId: 1009 },
  { letter: "b", name: "b.root-servers.net", operator: "USC-ISI", measurementId: 1010 },
  { letter: "c", name: "c.root-servers.net", operator: "Cogent", measurementId: 1011 },
  { letter: "d", name: "d.root-servers.net", operator: "UMD", measurementId: 1012 },
  { letter: "e", name: "e.root-servers.net", operator: "NASA", measurementId: 1013 },
  { letter: "h", name: "h.root-servers.net", operator: "USArmy", measurementId: 1015 },
  { letter: "j", name: "j.root-servers.net", operator: "Verisign", measurementId: 1016 },
];

interface AtlasResult {
  prb_id: number;
  avg: number;
  min: number;
  max: number;
  rcvd: number;
  sent: number;
}

export async function fetchDnsRootLatency(
  probeIds: number[]
): Promise<DnsRootLatencySummary[]> {
  if (probeIds.length === 0) return [];

  const probeParam = probeIds.join(",");
  const results: DnsRootLatencySummary[] = [];

  // Fetch all measurements in parallel
  const fetches = VERIFIED_MEASUREMENTS.map(async (root) => {
    try {
      const res = await fetch(
        `${ATLAS_BASE}/measurements/${root.measurementId}/latest/?probe_ids=${probeParam}&format=json`,
        { next: { revalidate: 600 } } // 10 minutes
      );
      if (!res.ok) return null;

      const data: AtlasResult[] = await res.json();
      // Filter to results that actually have RTT data
      const valid = data.filter((r) => r.avg > 0 && r.rcvd > 0);

      if (valid.length === 0) return null;

      const rtts = valid.map((r) => r.avg);
      const mins = valid.map((r) => r.min);
      const maxs = valid.map((r) => r.max);

      return {
        rootServer: root.letter,
        serverName: root.name,
        operator: root.operator,
        avgRtt: Math.round((rtts.reduce((a, b) => a + b, 0) / rtts.length) * 100) / 100,
        minRtt: Math.round(Math.min(...mins) * 100) / 100,
        maxRtt: Math.round(Math.max(...maxs) * 100) / 100,
        probeCount: valid.length,
      };
    } catch {
      return null;
    }
  });

  const settled = await Promise.all(fetches);
  for (const r of settled) {
    if (r) results.push(r);
  }

  // Sort alphabetically by root server letter
  results.sort((a, b) => a.rootServer.localeCompare(b.rootServer));

  return results;
}
