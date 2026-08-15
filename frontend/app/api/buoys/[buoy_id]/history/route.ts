import { NextResponse } from "next/server";
import { BUOYS, historyFor } from "@/lib/demo/simulate";

export const dynamic = "force-dynamic";

/** Mirrors the backend `GET /buoys/{buoy_id}/history?limit=`. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ buoy_id: string }> }
) {
  const { buoy_id } = await params;
  if (!BUOYS[buoy_id]) {
    return NextResponse.json({ detail: "buoy not found" }, { status: 404 });
  }
  const limitParam = new URL(req.url).searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 200, 1), 400);
  return NextResponse.json({ buoy_id, series: historyFor(buoy_id, limit) });
}
