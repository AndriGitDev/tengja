import { NextResponse } from "next/server";
import { fetchRixPeering } from "@/lib/api/peeringdb";

export const revalidate = 14400; // 4 hours

export async function GET() {
  const data = await fetchRixPeering();
  return NextResponse.json(data);
}
