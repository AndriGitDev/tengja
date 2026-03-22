import { NextResponse } from "next/server";
import { fetchIcelandProbes } from "@/lib/api/ripe-atlas";
import { fetchDnsRootLatency } from "@/lib/api/ripe-atlas-dns";

export const revalidate = 600; // 10 minutes

export async function GET() {
  const probes = await fetchIcelandProbes();
  const probeIds = probes.map((p) => p.id);
  const latency = await fetchDnsRootLatency(probeIds);
  return NextResponse.json(latency);
}
