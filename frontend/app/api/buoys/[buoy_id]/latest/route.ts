import { NextResponse } from "next/server";
import { latestUpdate } from "@/lib/demo/simulate";

export const dynamic = "force-dynamic";

/** Mirrors the backend `GET /buoys/{buoy_id}/latest`. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ buoy_id: string }> }
) {
  const { buoy_id } = await params;
  const update = latestUpdate(buoy_id);
  if (!update) {
    return NextResponse.json({ detail: "buoy not found" }, { status: 404 });
  }
  return NextResponse.json(update);
}
