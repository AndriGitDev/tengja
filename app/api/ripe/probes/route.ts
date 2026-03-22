import { NextResponse } from "next/server";
import { fetchIcelandProbes, summarizeProbe } from "@/lib/api/ripe-atlas";

export const revalidate = 60;

export async function GET() {
  const probes = await fetchIcelandProbes();
  const summaries = probes.map(summarizeProbe);
  return NextResponse.json(summaries);
}
