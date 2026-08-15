import { NextResponse } from "next/server";
import { DEMO_MODE, API_BASE, WS_URL } from "@/lib/api";
import { BUOYS, METALS } from "@/lib/demo/simulate";
import { getWeather } from "@/lib/demo/weather";

export const dynamic = "force-dynamic";

/**
 * Health/provenance probe.
 *
 * IMPORTANT: this reports the state of THIS route handler's own environment
 * (NEXT_PUBLIC_API_BASE as baked into this deployment) — not the live backend.
 * Next.js inlines NEXT_PUBLIC_* vars at BUILD time, so setting the variable in
 * Vercel has no effect until the next deployment/redeploy after it was added.
 * If this still says "demo" after setting NEXT_PUBLIC_API_BASE, redeploy.
 */
export async function GET() {
  if (!DEMO_MODE) {
    // A real backend is configured — probe it directly so this endpoint tells
    // the truth about whether it's actually reachable, not just configured.
    let backendReachable = false;
    let backendError: string | null = null;
    try {
      const res = await fetch(`${API_BASE}/health`, {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      backendReachable = res.ok;
      if (!res.ok) backendError = `backend responded ${res.status}`;
    } catch (err) {
      backendError = err instanceof Error ? err.message : "fetch failed";
    }
    return NextResponse.json({
      status: backendReachable ? "ok" : "degraded",
      mode: "backend",
      api_base: API_BASE,
      ws_url: WS_URL,
      backend_reachable: backendReachable,
      backend_error: backendError,
      note: backendReachable
        ? "Using the real FastAPI + scikit-learn backend."
        : "NEXT_PUBLIC_API_BASE is set, but the backend did not respond — check it's deployed, awake, and CORS allows this origin.",
    });
  }

  const weather = await getWeather();
  const live = Object.values(weather).some((w) => w.source === "open-meteo");
  return NextResponse.json({
    status: "ok",
    mode: "demo",
    note: "Built-in simulated data layer. Set NEXT_PUBLIC_API_BASE (and redeploy) to use the FastAPI + scikit-learn backend instead.",
    weather_source: live ? "open-meteo" : "fallback",
    metals: METALS,
    buoys: Object.keys(BUOYS),
  });
}
