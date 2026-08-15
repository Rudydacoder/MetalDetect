/**
 * Built-in demo data layer.
 *
 * When no FastAPI backend is configured (NEXT_PUBLIC_API_BASE unset — e.g. a
 * bare Vercel deployment), the Next.js route handlers in app/api serve data
 * from here instead, so the dashboard is fully alive with zero setup.
 *
 * It mirrors the backend's behaviour:
 *   - the same Langmuir sensor-response curve (backend/utils/simulator.py)
 *   - the same concentration inversion in place of the trained regressors
 *   - the same rule-based attribution scoring (backend/ml/attribution.py)
 *
 * Determinism: readings are a pure function of (buoy, timestamp-bucket), seeded
 * by a small hash PRNG. That matters because serverless invocations share no
 * memory — every request recomputes the series and still gets a coherent,
 * continuous history rather than random noise.
 *
 * The deployed demo therefore does NOT run the trained scikit-learn models —
 * it inverts the same sensor curve those models were fitted to. Point the app
 * at the real backend to exercise the actual ML pipeline.
 */
import {
  BUOYS,
  CANDIDATE_SOURCES,
  LAKES,
  LANGMUIR,
  METAL_NAMES,
  METAL_RANGES,
  METALS,
  SETPOINTS,
  statusFor,
} from "./sites.generated";

export const MODEL_VERSION = "demo-sim-v1";

/** Cadence of the simulated buoy, matching backend HISTORY_STEP_MINUTES. */
export const STEP_MINUTES = 15;
const HISTORY_HOURS = 48;

/* ----------------------------------------------------------------- rng --- */

/** Deterministic 32-bit hash → seed. */
function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, well-distributed PRNG. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller normal draw. */
function normal(r: () => number, mean: number, sd: number): number {
  const u = Math.max(r(), 1e-9);
  const v = r();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/* -------------------------------------------------------- concentration --- */

/** Index of the 15-minute bucket a timestamp falls in. */
function bucketOf(ms: number): number {
  return Math.floor(ms / (STEP_MINUTES * 60 * 1000));
}

const BUOY_IDS = Object.keys(BUOYS);

/** Buckets an incident stays hot for (4 buckets = 1 hour at 15-min cadence). */
const INCIDENT_SLOT = 4;

/**
 * Rotating incident schedule.
 *
 * The random spikes below are genuinely occasional, which is realistic but
 * means Alerts can sit empty — unacceptable for a demo that has to show source
 * attribution on command. So two buoys are always mid-incident, walking through
 * the network on a rotation (co-prime strides so the pairing keeps changing).
 * It's deterministic, so every serverless invocation agrees on who's alerting.
 *
 * Returns the metal under excursion and how far through the event we are.
 */
function scheduledIncident(
  buoyId: string,
  bucket: number
): { metal: string; decay: number } | null {
  const n = BUOY_IDS.length;
  const idx = BUOY_IDS.indexOf(buoyId);
  if (idx < 0) return null;

  const slot = Math.floor(bucket / INCIDENT_SLOT);
  const first = (slot * 3) % n;
  const second = (slot * 3 + 5) % n;
  if (idx !== first && idx !== second) return null;

  const metal = METALS[(slot + idx) % METALS.length];
  const within = bucket - slot * INCIDENT_SLOT;
  // Fade across the slot but never fully — keeps it above the alert line.
  const decay = 1 - (within / INCIDENT_SLOT) * 0.35;
  return { metal, decay };
}

/**
 * True concentration for a buoy/metal at a given step.
 *
 * A smooth mean-reverting wander around the lake's setpoint (sum of a few
 * incommensurate sines so it's continuous across bucket boundaries), plus
 * spike events that decay — standing in for the backend's rainfall-driven
 * runoff spikes so Alerts has real events to show.
 */
function trueConcentration(buoyId: string, lakeId: string, metal: string, bucket: number): number {
  const range = METAL_RANGES[metal];
  const setpoint = SETPOINTS[lakeId]?.[metal] ?? range.baseline;
  const k = hash(`${buoyId}|${metal}`);

  // Smooth drift: phase-offset sines keep neighbouring buckets continuous.
  const p1 = (k % 1000) / 1000;
  const p2 = ((k >> 10) % 1000) / 1000;
  const p3 = ((k >> 20) % 1000) / 1000;
  const wander =
    Math.sin(bucket * 0.017 + p1 * 6.283) * 0.55 +
    Math.sin(bucket * 0.0431 + p2 * 6.283) * 0.3 +
    Math.sin(bucket * 0.1103 + p3 * 6.283) * 0.15;

  let conc = setpoint * (1 + wander * 0.28);

  // Spike events: each buoy/metal has a rare, decaying excursion.
  // ~1 window in 22 starts a spike, lasting 4-8 steps.
  const window = Math.floor(bucket / 8);
  const spikeRoll = rng(hash(`${buoyId}|${metal}|spike|${window}`))();
  if (spikeRoll < 0.045) {
    const within = bucket - window * 8;
    const life = 6;
    if (within < life) {
      const decay = 1 - within / life;
      conc = conc * 1.5 + range.alert * 0.85 * decay;
    }
  }

  // Scheduled incident — guarantees the network always has live alerts.
  const incident = scheduledIncident(buoyId, bucket);
  if (incident && incident.metal === metal) {
    // Push clearly past the alert threshold so the status is unambiguous.
    conc = Math.max(conc, range.alert * (1.15 + 0.5 * incident.decay));
  }

  // Small per-step jitter, still deterministic for this exact bucket.
  const r = rng(hash(`${buoyId}|${metal}|${bucket}`));
  conc += normal(r, 0, range.baseline * 0.05);

  return clamp(conc, 0, range.max);
}

/* -------------------------------------------------------------- reading --- */

export interface DemoReading {
  buoy_id: string;
  lake_id: string;
  timestamp: string;
  swv_readings: Record<string, number>;
  pH: number;
  conductivity: number;
  water_temp: number;
  battery_voltage: number;
  ref_electrode_drift: number;
  sensor_age_days: number;
}

export interface DemoEstimate {
  metal: string;
  metal_name: string;
  estimated_concentration: number;
  status: "normal" | "elevated" | "alert";
  model_version: string;
}

/** Build the sensor payload for one buoy at one time bucket. */
function readingAt(buoyId: string, bucket: number): DemoReading {
  const buoy = BUOYS[buoyId];
  const r = rng(hash(`${buoyId}|env|${bucket}`));

  const pH = normal(r, 7.4, 0.3);
  const conductivity = normal(r, 480, 60);
  const waterTemp = normal(r, 29.0, 1.2);
  const battery = clamp(normal(r, 3.95, 0.08), 3.4, 4.2);

  const ageDays = 42 + (bucket % 4000) * (STEP_MINUTES / (60 * 24));
  const drift = 0.0008 * ageDays;

  // Same forward model as the backend simulator: Langmuir response with
  // pH / conductivity / temperature confounders, drift and noise.
  const swv: Record<string, number> = {};
  for (const m of METALS) {
    const p = LANGMUIR[m];
    const c = trueConcentration(buoyId, buoy.lake_id, m, bucket);
    let signal = p.base + (p.i_max * c) / (p.kd + c);
    signal *= 1 + 0.04 * (pH - 7.4);
    signal *= 1 + 0.0003 * (conductivity - 480);
    signal *= 1 + 0.008 * (waterTemp - 29.0);
    signal += drift + normal(r, 0, 0.05);
    swv[m] = Number(signal.toFixed(4));
  }

  return {
    buoy_id: buoyId,
    lake_id: buoy.lake_id,
    timestamp: new Date(bucket * STEP_MINUTES * 60 * 1000).toISOString(),
    swv_readings: swv,
    pH: Number(pH.toFixed(2)),
    conductivity: Number(conductivity.toFixed(1)),
    water_temp: Number(waterTemp.toFixed(2)),
    battery_voltage: Number(battery.toFixed(3)),
    ref_electrode_drift: Number(drift.toFixed(4)),
    sensor_age_days: Number(ageDays.toFixed(2)),
  };
}

/**
 * Recover concentration from the SWV signal.
 *
 * The trained regressors learn this same inversion; here we invert the Langmuir
 * curve analytically and add a little residual so the numbers look like model
 * output rather than a perfect round-trip.
 */
function estimate(reading: DemoReading): DemoEstimate[] {
  const r = rng(hash(`${reading.buoy_id}|est|${reading.timestamp}`));
  return METALS.map((m) => {
    const p = LANGMUIR[m];
    let signal = reading.swv_readings[m] - reading.ref_electrode_drift;
    // Undo the environmental confounders the sensor picked up.
    signal /= 1 + 0.04 * (reading.pH - 7.4);
    signal /= 1 + 0.0003 * (reading.conductivity - 480);
    signal /= 1 + 0.008 * (reading.water_temp - 29.0);

    // Invert i = base + i_max * c / (kd + c)  ->  c = kd * y / (i_max - y)
    const y = Math.max(signal - p.base, 1e-4);
    let conc = (p.kd * y) / Math.max(p.i_max - y, 1e-3);
    conc = Math.max(0, conc * (1 + normal(r, 0, 0.03)));
    conc = clamp(conc, 0, METAL_RANGES[m].max);

    return {
      metal: m,
      metal_name: METAL_NAMES[m],
      estimated_concentration: Number(conc.toFixed(2)),
      status: statusFor(m, conc),
      model_version: MODEL_VERSION,
    };
  });
}

/* ---------------------------------------------------------- attribution --- */

export interface DemoCandidate {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  confidence: number;
  matched_metals: string[];
  note: string;
}

export interface DemoAttribution {
  buoy_id: string;
  lake_id: string;
  timestamp: string;
  triggered_metals: string[];
  ranked_candidates: DemoCandidate[];
  status: "flagged" | "clear";
  disclaimer: string;
}

const DISCLAIMER =
  "Flagged for investigation, not a determination of responsibility. Industrial markers are illustrative and fictional.";

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371.0;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

/** Same transparent scoring as backend/ml/attribution.py. */
function attribute(
  buoyId: string,
  lakeId: string,
  estimates: DemoEstimate[],
  timestamp: string
): DemoAttribution {
  const setpoints = SETPOINTS[lakeId] ?? {};
  const increase: Record<string, number> = {};
  const triggered: string[] = [];

  for (const e of estimates) {
    increase[e.metal] = e.estimated_concentration - (setpoints[e.metal] ?? 0);
    if (e.status === "alert") triggered.push(e.metal);
  }

  if (triggered.length === 0) {
    return {
      buoy_id: buoyId,
      lake_id: lakeId,
      timestamp,
      triggered_metals: [],
      ranked_candidates: [],
      status: "clear",
      disclaimer: DISCLAIMER,
    };
  }

  const buoy = BUOYS[buoyId];
  const candidates = CANDIDATE_SOURCES[lakeId] ?? [];

  const raw = candidates.map((c) => {
    const matched = c.metal_fingerprint.filter((m) => triggered.includes(m));
    const fpScore = matched.reduce((s, m) => s + Math.max(0, increase[m] ?? 0), 0);
    const dist = haversineKm(buoy.lat, buoy.lng, c.lat, c.lng);
    const proximity = Math.exp(-dist / 2.0);
    // Non-industrial categories keep a floor so they're never dropped.
    const floor = c.type !== "industrial" ? 0.05 : 0.0;
    return { c, matched, score: fpScore * (0.5 + 0.5 * proximity) + floor };
  });

  const total = raw.reduce((s, x) => s + x.score, 0) || 1.0;
  const ranked = [...raw].sort((a, b) => b.score - a.score);

  return {
    buoy_id: buoyId,
    lake_id: lakeId,
    timestamp,
    triggered_metals: triggered,
    ranked_candidates: ranked.map(({ c, matched, score }) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      lat: c.lat,
      lng: c.lng,
      confidence: Number((score / total).toFixed(3)),
      matched_metals: matched,
      note: c.note ?? "",
    })),
    status: "flagged",
    disclaimer: DISCLAIMER,
  };
}

/* --------------------------------------------------------- public model --- */

export interface DemoLiveUpdate {
  reading: DemoReading;
  estimates: DemoEstimate[];
  attribution: DemoAttribution | null;
  overall_status: "normal" | "elevated" | "alert";
}

function overallStatus(estimates: DemoEstimate[]): "normal" | "elevated" | "alert" {
  const order = { normal: 0, elevated: 1, alert: 2 } as const;
  let worst: "normal" | "elevated" | "alert" = "normal";
  for (const e of estimates) if (order[e.status] > order[worst]) worst = e.status;
  return worst;
}

/** Full pipeline for one buoy at one bucket. */
export function updateAt(buoyId: string, bucket: number): DemoLiveUpdate {
  const reading = readingAt(buoyId, bucket);
  const estimates = estimate(reading);
  const attribution = attribute(buoyId, reading.lake_id, estimates, reading.timestamp);
  return {
    reading,
    estimates,
    attribution: attribution.status === "flagged" ? attribution : null,
    overall_status: overallStatus(estimates),
  };
}

/** Latest update for a buoy (current wall-clock bucket). */
export function latestUpdate(buoyId: string, now = Date.now()): DemoLiveUpdate | null {
  if (!BUOYS[buoyId]) return null;
  return updateAt(buoyId, bucketOf(now));
}

export function allLatest(now = Date.now()): Record<string, DemoLiveUpdate> {
  const out: Record<string, DemoLiveUpdate> = {};
  for (const id of Object.keys(BUOYS)) out[id] = updateAt(id, bucketOf(now));
  return out;
}

/** Concentration time series for the Trends view. */
export function historyFor(buoyId: string, limit = 200, now = Date.now()) {
  if (!BUOYS[buoyId]) return [];
  const end = bucketOf(now);
  const maxSteps = Math.floor((HISTORY_HOURS * 60) / STEP_MINUTES);
  const steps = Math.min(limit, maxSteps);
  const rows: Record<string, number | string>[] = [];
  for (let i = steps - 1; i >= 0; i--) {
    const bucket = end - i;
    const reading = readingAt(buoyId, bucket);
    const row: Record<string, number | string> = { timestamp: reading.timestamp };
    for (const e of estimate(reading)) row[e.metal] = e.estimated_concentration;
    rows.push(row);
  }
  return rows;
}

/** Every currently-flagged attribution, for the Alerts view. */
export function allAttributions(now = Date.now()): DemoAttribution[] {
  const out: DemoAttribution[] = [];
  const bucket = bucketOf(now);
  for (const id of Object.keys(BUOYS)) {
    // Look back a little so Alerts isn't empty between spikes.
    for (let back = 0; back < 12; back++) {
      const u = updateAt(id, bucket - back);
      if (u.attribution) {
        out.push(u.attribution);
        break;
      }
    }
  }
  return out;
}

export function attributionFor(buoyId: string, now = Date.now()): DemoAttribution | null {
  const bucket = bucketOf(now);
  for (let back = 0; back < 12; back++) {
    const u = updateAt(buoyId, bucket - back);
    if (u.attribution) return u.attribution;
  }
  return null;
}

export function statusOf(buoyId: string, now = Date.now()): "normal" | "elevated" | "alert" {
  return updateAt(buoyId, bucketOf(now)).overall_status;
}

export { BUOYS, LAKES, CANDIDATE_SOURCES, METALS, METAL_NAMES, METAL_RANGES };
