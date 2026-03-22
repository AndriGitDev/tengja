import { NextResponse } from "next/server";
import { fetchIcelandBgpOverview } from "@/lib/api/ripe-stat";

export const revalidate = 7200; // 2 hours

export async function GET() {
  const data = await fetchIcelandBgpOverview();
  return NextResponse.json(data);
}
