import type { PeeringDbNetIxLan, RixMemberSummary, RixSummary } from "./types";

const PEERINGDB_BASE = "https://www.peeringdb.com/api";
const RIX_IX_ID = 228;

function formatSpeed(speedMbps: number): string {
  if (speedMbps >= 1000000) return `${speedMbps / 1000000}T`;
  if (speedMbps >= 1000) return `${speedMbps / 1000}G`;
  return `${speedMbps}M`;
}

function formatPortSpeed(ports: PeeringDbNetIxLan[]): string {
  if (ports.length === 1) return formatSpeed(ports[0].speed);

  // Group ports by speed
  const bySpeed = new Map<number, number>();
  for (const p of ports) {
    bySpeed.set(p.speed, (bySpeed.get(p.speed) ?? 0) + 1);
  }

  // If all same speed, show "Nx..."
  if (bySpeed.size === 1) {
    const [speed, count] = [...bySpeed.entries()][0];
    return `${count}×${formatSpeed(speed)}`;
  }

  // Mixed speeds: show each group
  return [...bySpeed.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([speed, count]) => count > 1 ? `${count}×${formatSpeed(speed)}` : formatSpeed(speed))
    .join("+");
}

export async function fetchRixPeering(): Promise<RixSummary> {
  try {
    const res = await fetch(
      `${PEERINGDB_BASE}/netixlan?ix_id=${RIX_IX_ID}`,
      { next: { revalidate: 14400 } } // 4 hours
    );

    if (!res.ok) throw new Error(`PeeringDB ${res.status}`);

    const json = await res.json();
    const entries: PeeringDbNetIxLan[] = json.data ?? [];

    // Group by ASN
    const byAsn = new Map<number, PeeringDbNetIxLan[]>();
    for (const entry of entries) {
      if (!entry.operational) continue;
      const group = byAsn.get(entry.asn) ?? [];
      group.push(entry);
      byAsn.set(entry.asn, group);
    }

    // The "name" field on netixlan is the IX name (always "RIX"), not the network name.
    // We need to fetch network names from the /net endpoint.
    const allAsns = [...byAsn.keys()];
    const asnNames = new Map<number, string>();

    try {
      const netRes = await fetch(
        `${PEERINGDB_BASE}/net?asn__in=${allAsns.join(",")}&fields=asn,name`,
        { next: { revalidate: 14400 } }
      );
      if (netRes.ok) {
        const netJson = await netRes.json();
        for (const net of netJson.data ?? []) {
          asnNames.set(net.asn, net.name);
        }
      }
    } catch {
      // Fallback: use ASN number as name
    }

    const members: RixMemberSummary[] = [];
    let totalCapacity = 0;
    let totalPorts = 0;

    for (const [asn, ports] of byAsn) {
      const totalSpeed = ports.reduce((s, p) => s + p.speed, 0);

      members.push({
        asn,
        name: asnNames.get(asn) ?? `AS${asn}`,
        totalSpeedMbps: totalSpeed,
        portCount: ports.length,
        speedLabel: formatPortSpeed(ports),
        hasIpv4: ports.some((p) => !!p.ipaddr4),
        hasIpv6: ports.some((p) => !!p.ipaddr6),
        isRsPeer: ports.some((p) => p.is_rs_peer),
      });

      totalCapacity += totalSpeed;
      totalPorts += ports.length;
    }

    // Sort by total speed descending
    members.sort((a, b) => b.totalSpeedMbps - a.totalSpeedMbps);

    return {
      members,
      totalCapacityGbps: Math.round(totalCapacity / 1000),
      uniqueAsnCount: byAsn.size,
      totalPortCount: totalPorts,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error("PeeringDB fetch failed, using fallback:", err);
    return {
      members: [
        { asn: 44735, name: "NOVA", totalSpeedMbps: 100000, portCount: 1, speedLabel: "100G", hasIpv4: true, hasIpv6: true, isRsPeer: false },
        { asn: 6677, name: "Síminn", totalSpeedMbps: 100000, portCount: 1, speedLabel: "100G", hasIpv4: true, hasIpv6: true, isRsPeer: false },
        { asn: 51896, name: "Hringdu", totalSpeedMbps: 100000, portCount: 1, speedLabel: "100G", hasIpv4: true, hasIpv6: true, isRsPeer: false },
        { asn: 12969, name: "Ljósleiðarinn", totalSpeedMbps: 200000, portCount: 2, speedLabel: "2×100G", hasIpv4: true, hasIpv6: true, isRsPeer: false },
        { asn: 211589, name: "RÚV", totalSpeedMbps: 300000, portCount: 3, speedLabel: "3×100G", hasIpv4: true, hasIpv6: true, isRsPeer: false },
      ],
      totalCapacityGbps: 740,
      uniqueAsnCount: 6,
      totalPortCount: 6,
      lastUpdated: new Date().toISOString(),
    };
  }
}
