import { cables } from "@/lib/data/cables";
import { getTrafficMultiplier } from "./time-curves";
import { tickEvents, getEventMultiplier } from "./events";

export interface CableMetrics {
  cableId: string;
  throughputTbps: number;
  latencyMs: number;
  packetsPerSec: number;
  utilization: number; // 0-1
}

export interface GlobalMetrics {
  totalThroughputTbps: number;
  totalPacketsPerSec: number;
  ixPeers: number;
  dnsQueriesPerSec: number;
  ripeProbes: number;
}

// Base latency for each cable (ms)
const baseLatency: Record<string, number> = {
  danice: 28,
  farice1: 34,
  "greenland-connect": 82,
};

// Base utilization fraction
const baseUtilization: Record<string, number> = {
  danice: 0.72,
  farice1: 0.65,
  "greenland-connect": 0.48,
};

let lastTick = Date.now();

function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * 2 * range;
}

export function generateCableMetrics(): CableMetrics[] {
  const now = Date.now();
  const delta = now - lastTick;
  lastTick = now;

  tickEvents(delta);
  const timeMult = getTrafficMultiplier();

  return cables.map((cable) => {
    const eventMult = getEventMultiplier(cable.id);
    const util =
      (baseUtilization[cable.id] ?? 0.6) * timeMult * eventMult;
    const throughput = jitter(cable.capacityTbps * util, cable.capacityTbps * 0.02);
    const latency = jitter(
      baseLatency[cable.id] ?? 50,
      2
    );
    const pps = throughput * 1e12 / (1500 * 8); // packets assuming 1500 byte MTU

    return {
      cableId: cable.id,
      throughputTbps: Math.max(0, throughput),
      latencyMs: Math.max(1, latency),
      packetsPerSec: Math.max(0, pps),
      utilization: Math.max(0, Math.min(1, util)),
    };
  });
}

export function generateGlobalMetrics(cableMetrics: CableMetrics[]): GlobalMetrics {
  const totalThroughput = cableMetrics.reduce((s, c) => s + c.throughputTbps, 0);
  const totalPps = cableMetrics.reduce((s, c) => s + c.packetsPerSec, 0);

  return {
    totalThroughputTbps: totalThroughput,
    totalPacketsPerSec: totalPps,
    ixPeers: 6,
    dnsQueriesPerSec: jitter(12400, 800),
    ripeProbes: 16,
  };
}
