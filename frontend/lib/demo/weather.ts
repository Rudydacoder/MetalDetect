/**
 * Live weather via Open-Meteo (https://open-meteo.com) for the built-in demo
 * data layer — the same open, key-free source the Python backend uses.
 *
 * Runs server-side only (inside route handlers), so no key, no CORS concern and
 * no client cost. One batched request covers every lake. Falls back to the
 * seasonal averages generated from the backend if the API is unreachable, so a
 * network failure never breaks the dashboard.
 */
import { FALLBACK_WEATHER, LAKES } from "./sites.generated";

export interface WeatherEntry {
  ambient_temp: number;
  rainfall_24h: number;
  source: "open-meteo" | "fallback";
}

const API_URL = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL_MS = 15 * 60 * 1000;
const TIMEOUT_MS = 6000;

let cache: Record<string, WeatherEntry> | null = null;
let cachedAt = 0;
let inFlight: Promise<Record<string, WeatherEntry>> | null = null;

function fallbackAll(): Record<string, WeatherEntry> {
  const out: Record<string, WeatherEntry> = {};
  for (const [id, w] of Object.entries(FALLBACK_WEATHER)) {
    out[id] = { ...w, source: "fallback" };
  }
  return out;
}

async function fetchOpenMeteo(): Promise<Record<string, WeatherEntry>> {
  const ids = Object.keys(LAKES);
  const params = new URLSearchParams({
    latitude: ids.map((i) => String(LAKES[i].lat)).join(","),
    longitude: ids.map((i) => String(LAKES[i].lng)).join(","),
    current: "temperature_2m,precipitation",
    daily: "precipitation_sum",
    past_days: "1",
    forecast_days: "1",
    timezone: "UTC",
  });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}?${params}`, {
      signal: ctrl.signal,
      // Route handlers are dynamic; let Next cache the upstream call too.
      next: { revalidate: 900 },
    });
    if (!res.ok) throw new Error(`open-meteo ${res.status}`);
    const payload = await res.json();
    const entries = Array.isArray(payload) ? payload : [payload];
    if (entries.length !== ids.length) throw new Error("length mismatch");

    const out: Record<string, WeatherEntry> = {};
    ids.forEach((id, i) => {
      const e = entries[i];
      const temp = e?.current?.temperature_2m;
      // past_days=1 puts yesterday first — the true trailing 24h total.
      const sums = e?.daily?.precipitation_sum;
      const rain = Array.isArray(sums) ? sums[0] : null;
      if (typeof temp !== "number") {
        out[id] = { ...FALLBACK_WEATHER[id], source: "fallback" };
        return;
      }
      out[id] = {
        ambient_temp: Math.round(temp * 10) / 10,
        rainfall_24h: Math.round((typeof rain === "number" ? rain : 0) * 10) / 10,
        source: "open-meteo",
      };
    });
    return out;
  } finally {
    clearTimeout(timer);
  }
}

/** Weather for every lake — cached, with a static fallback on any failure. */
export async function getWeather(): Promise<Record<string, WeatherEntry>> {
  const now = Date.now();
  if (cache && now - cachedAt < CACHE_TTL_MS) return cache;
  if (inFlight) return inFlight;

  inFlight = fetchOpenMeteo()
    .then((fresh) => {
      cache = fresh;
      cachedAt = Date.now();
      return fresh;
    })
    .catch(() => {
      // Cache the fallback briefly too, so we don't retry on every request.
      cache = fallbackAll();
      cachedAt = Date.now();
      return cache;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export async function getWeatherFor(lakeId: string): Promise<WeatherEntry> {
  const all = await getWeather();
  return (
    all[lakeId] ?? {
      ...(FALLBACK_WEATHER[lakeId] ?? { ambient_temp: 30, rainfall_24h: 0 }),
      source: "fallback",
    }
  );
}
