// REST + WebSocket client for the MetalDetect backend.
//
// Two modes, chosen by environment:
//
//   * Real backend  - set NEXT_PUBLIC_API_BASE (and optionally
//                     NEXT_PUBLIC_WS_URL) to a running FastAPI service. The app
//                     then uses the trained scikit-learn models and the live
//                     WebSocket feed.
//   * Demo mode     - leave them unset (the default, e.g. a bare Vercel
//                     deployment). Requests go to same-origin `/api/*` route
//                     handlers backed by the built-in simulator, and the live
//                     feed polls instead of holding a socket open.
//
// This is what lets the Vercel deployment work with zero configuration.
import type { AttributionResult, Lake, LiveUpdate } from "./types";

const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE?.trim();

/** True when we're serving data from the built-in demo layer. */
export const DEMO_MODE = !RAW_BASE;

/** Strip a trailing slash so `${API_BASE}/lakes` never doubles up. */
export const API_BASE = RAW_BASE ? RAW_BASE.replace(/\/+$/, "") : "/api";

/**
 * WebSocket URL, or null in demo mode (serverless can't hold a socket open, so
 * `useLiveFeed` polls `/api/live` instead).
 */
export const WS_URL = DEMO_MODE
  ? null
  : process.env.NEXT_PUBLIC_WS_URL?.trim() || `${API_BASE.replace(/^http/, "ws")}/live`;

/** Polling endpoint used in demo mode. */
export const LIVE_POLL_URL = "/api/live";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  lakes: () => get<Lake[]>("/lakes"),
  lake: (id: string) => get<Lake>(`/lakes/${id}`),
  latest: (buoyId: string) => get<LiveUpdate>(`/buoys/${buoyId}/latest`),
  history: (buoyId: string, limit = 200) =>
    get<{ buoy_id: string; series: Record<string, number | string>[] }>(
      `/buoys/${buoyId}/history?limit=${limit}`
    ),
  attribution: (buoyId: string) =>
    get<AttributionResult>(`/attribution/${buoyId}`),
  alerts: () => get<AttributionResult[]>("/attribution"),
};
