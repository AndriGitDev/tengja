import { NextResponse } from "next/server";
import { fetchProbesWithMeasurements } from "@/lib/api/ripe-atlas";

export const revalidate = 120;

export async function GET() {
  const probes = await fetchProbesWithMeasurements();
  return NextResponse.json(probes);
}
