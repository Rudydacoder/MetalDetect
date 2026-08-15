import { NextResponse } from "next/server";
import { BUOYS, LAKES, statusOf } from "@/lib/demo/simulate";
import { getWeather } from "@/lib/demo/weather";

// Always fresh — the simulated readings advance with wall-clock time.
export const dynamic = "force-dynamic";

/** Mirrors the backend `GET /lakes`. */
export async function GET() {
  const weather = await getWeather();
  const out = Object.values(LAKES).map((lake) => ({
    ...lake,
    buoys: Object.values(BUOYS)
      .filter((b) => b.lake_id === lake.id)
      .map((b) => ({ ...b, status: statusOf(b.id) })),
    weather: weather[lake.id],
  }));
  return NextResponse.json(out);
}
