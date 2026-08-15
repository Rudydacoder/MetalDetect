import { NextResponse } from "next/server";
import { BUOYS, CANDIDATE_SOURCES, LAKES, statusOf } from "@/lib/demo/simulate";
import { getWeatherFor } from "@/lib/demo/weather";

export const dynamic = "force-dynamic";

/** Mirrors the backend `GET /lakes/{lake_id}`. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lake_id: string }> }
) {
  const { lake_id } = await params;
  const lake = LAKES[lake_id];
  if (!lake) {
    return NextResponse.json({ detail: "lake not found" }, { status: 404 });
  }
  return NextResponse.json({
    ...lake,
    buoys: Object.values(BUOYS)
      .filter((b) => b.lake_id === lake_id)
      .map((b) => ({ ...b, status: statusOf(b.id) })),
    weather: await getWeatherFor(lake_id),
    candidate_sources: CANDIDATE_SOURCES[lake_id] ?? [],
  });
}
