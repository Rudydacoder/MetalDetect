// REST + WebSocket client for the MetalDetect backend.
import type { AttributionResult, Lake, LiveUpdate } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://127.0.0.1:8000/live";

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
