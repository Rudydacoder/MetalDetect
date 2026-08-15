import { NextResponse } from "next/server";
import { attributionFor } from "@/lib/demo/simulate";

export const dynamic = "force-dynamic";

/** Mirrors the backend `GET /attribution/{buoy_id}`. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ buoy_id: string }> }
) {
  const { buoy_id } = await params;
  const result = attributionFor(buoy_id);
  if (!result) {
    return NextResponse.json({
      buoy_id,
      status: "clear",
      ranked_candidates: [],
    });
  }
  return NextResponse.json(result);
}
