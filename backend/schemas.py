"""Pydantic models defining the payload contract.

The `SensorReading` shape here is the single contract shared by the simulator,
the ingestion API, the ML pipeline and the frontend. It intentionally mirrors
a decoded LoRaWAN uplink (PRD 3.2 / 6 / 10) so that swapping the simulator for
real buoy hardware later requires **no** backend changes.
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class SensorReading(BaseModel):
    """Raw payload as received from a buoy (real or simulated)."""

    buoy_id: str
    lake_id: str
    timestamp: datetime
    swv_readings: dict[str, float] = Field(
        ..., description="SWV peak current (uA) per metal channel"
    )
    pH: float
    conductivity: float          # uS/cm
    water_temp: float            # deg C
    battery_voltage: float       # V
    ref_electrode_drift: float = 0.0
    sensor_age_days: float = 0.0


class ConcentrationEstimate(BaseModel):
    metal: str
    metal_name: str
    estimated_concentration: float   # ug/L
    status: Literal["normal", "elevated", "alert"]
    model_version: str


class Candidate(BaseModel):
    id: str
    name: str
    type: Literal["industrial", "agricultural", "sewage", "natural"]
    lat: float
    lng: float
    confidence: float                # 0..1, normalized across the list
    matched_metals: list[str]
    note: str = ""


class AttributionResult(BaseModel):
    buoy_id: str
    lake_id: str
    timestamp: datetime
    triggered_metals: list[str]
    ranked_candidates: list[Candidate]
    status: Literal["flagged", "clear"] = "flagged"
    disclaimer: str = (
        "Flagged for investigation only — not a determination of "
        "responsibility. Industrial markers are illustrative and fictional."
    )


class LiveUpdate(BaseModel):
    """What gets pushed over the WebSocket on every new reading."""

    reading: SensorReading
    estimates: list[ConcentrationEstimate]
    attribution: Optional[AttributionResult] = None
    overall_status: Literal["normal", "elevated", "alert"]
