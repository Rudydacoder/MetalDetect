import { NextResponse } from "next/server";
import { BUOYS, METALS } from "@/lib/demo/simulate";
import { getWeather } from "@/lib/demo/weather";

export const dynamic = "force-dynamic";

/** Health/provenance probe for the built-in demo data layer. */
export async function GET() {
  const weather = await getWeather();
  const live = Object.values(weather).some((w) => w.source === "open-meteo");
  return NextResponse.json({
    status: "ok",
    mode: "demo",
    note: "Built-in simulated data layer. Set NEXT_PUBLIC_API_BASE to use the FastAPI + scikit-learn backend.",
    weather_source: live ? "open-meteo" : "fallback",
    metals: METALS,
    buoys: Object.keys(BUOYS),
  });
}
