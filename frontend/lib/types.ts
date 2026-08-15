// Shared types mirroring the backend payload contract (backend/schemas.py).

export type Status = "normal" | "elevated" | "alert";
export type CandidateType =
  | "industrial"
  | "agricultural"
  | "sewage"
  | "natural";

export interface SensorReading {
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

export interface ConcentrationEstimate {
  metal: string;
  metal_name: string;
  estimated_concentration: number;
  status: Status;
  model_version: string;
}

export interface Candidate {
  id: string;
  name: string;
  type: CandidateType;
  lat: number;
  lng: number;
  confidence: number;
  matched_metals: string[];
  note: string;
}

export interface AttributionResult {
  buoy_id: string;
  lake_id: string;
  timestamp: string;
  triggered_metals: string[];
  ranked_candidates: Candidate[];
  status: "flagged" | "clear";
  disclaimer: string;
}

export interface LiveUpdate {
  reading: SensorReading;
  estimates: ConcentrationEstimate[];
  attribution: AttributionResult | null;
  overall_status: Status;
}

export interface Buoy {
  id: string;
  lake_id: string;
  lat: number;
  lng: number;
  deployment_date: string;
  status: Status;
}

export interface Weather {
  ambient_temp: number;
  rainfall_24h: number;
}

export interface Lake {
  id: string;
  name: string;
  city_region: string;
  lat: number;
  lng: number;
  description: string;
  buoys: Buoy[];
  weather: Weather;
  candidate_sources?: Candidate[];
}

export const STATUS_COLOR: Record<Status, string> = {
  normal: "#5fb894",
  elevated: "#B9915E",
  alert: "#e0697a",
};

export const TYPE_LABEL: Record<CandidateType, string> = {
  industrial: "Industrial",
  agricultural: "Agricultural",
  sewage: "Sewage / Urban",
  natural: "Natural",
};
