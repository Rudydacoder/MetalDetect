"""Dumps the backend site data to a TypeScript module so the Next.js demo
fallback stays in exact parity with the Python backend."""
import json
import sys

sys.path.insert(0, r"D:\my baby's\SRCAS\MetalDetect\backend")

from config import METAL_NAMES, METAL_RANGES, METALS  # noqa: E402
from data.sites import BUOYS, CANDIDATE_SOURCES, LAKES, SETPOINTS, WEATHER  # noqa: E402
from ml.generate_dataset import LANGMUIR  # noqa: E402

def j(obj):
    return json.dumps(obj, indent=2, ensure_ascii=False)

out = f'''// AUTO-GENERATED from the Python backend — do not edit by hand.
// Regenerate with: scripts/gen-demo-data.py (see README).
//
// This mirrors backend/data/sites.py + backend/config.py so the built-in demo
// data layer (used when no FastAPI backend is configured) produces exactly the
// same lakes, buoys, thresholds and candidate sources as the real backend.

export const METALS: string[] = {j(METALS)};

export const METAL_NAMES: Record<string, string> = {j(METAL_NAMES)};

export interface MetalRange {{
  baseline: number;
  elevated: number;
  alert: number;
  max: number;
}}

export const METAL_RANGES: Record<string, MetalRange> = {j(METAL_RANGES)};

/** Langmuir sensor-response curve per metal (SWV current from concentration). */
export const LANGMUIR: Record<string, {{ i_max: number; kd: number; base: number }}> =
{j(LANGMUIR)};

export const LAKES: Record<string, {{
  id: string;
  name: string;
  city_region: string;
  lat: number;
  lng: number;
  description: string;
}}> = {j(LAKES)};

export const BUOYS: Record<string, {{
  id: string;
  lake_id: string;
  lat: number;
  lng: number;
  deployment_date: string;
  status: string;
}}> = {j(BUOYS)};

/** Historical per-lake baseline concentration used by attribution. */
export const SETPOINTS: Record<string, Record<string, number>> = {j(SETPOINTS)};

export const CANDIDATE_SOURCES: Record<string, {{
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  metal_fingerprint: string[];
  note: string;
}}[]> = {j(CANDIDATE_SOURCES)};

/** Seasonal averages — used only when Open-Meteo is unreachable. */
export const FALLBACK_WEATHER: Record<string, {{ ambient_temp: number; rainfall_24h: number }}> =
{j(WEATHER)};

/** Traffic-light status for a concentration, matching backend config.status_for. */
export function statusFor(metal: string, concentration: number): "normal" | "elevated" | "alert" {{
  const r = METAL_RANGES[metal];
  if (concentration >= r.alert) return "alert";
  if (concentration >= r.elevated) return "elevated";
  return "normal";
}}
'''

path = r"D:\my baby's\SRCAS\MetalDetect\frontend\lib\demo\sites.generated.ts"
import os
os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, "w", encoding="utf-8") as f:
    f.write(out)
print("wrote", path)
print("lakes:", len(LAKES), "buoys:", len(BUOYS), "candidate lakes:", len(CANDIDATE_SOURCES))
