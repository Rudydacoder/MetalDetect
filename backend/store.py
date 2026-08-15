"""In-memory data store + derived-result cache.

A dict-backed store is plenty for a single-node hackathon demo and keeps the
whole thing dependency-free and offline. On startup it is seeded with ~48h of
simulated history so every view has data immediately.
"""
from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime
from typing import Optional

from config import METALS, status_for
from data.sites import BUOYS
from ml.attribution import attribute
from ml.pipeline import predict
from schemas import AttributionResult, ConcentrationEstimate, LiveUpdate, SensorReading
from utils.simulator import seed_history

MAX_PER_BUOY = 400

# buoy_id -> deque[SensorReading]
_readings: dict[str, deque[SensorReading]] = defaultdict(lambda: deque(maxlen=MAX_PER_BUOY))
# buoy_id -> deque[list[ConcentrationEstimate]] aligned with _readings
_estimates: dict[str, deque[list[ConcentrationEstimate]]] = defaultdict(
    lambda: deque(maxlen=MAX_PER_BUOY)
)
# buoy_id -> latest AttributionResult
_attribution: dict[str, AttributionResult] = {}
# buoy_id -> latest overall status
_status: dict[str, str] = {}


def _overall_status(estimates: list[ConcentrationEstimate]) -> str:
    order = {"normal": 0, "elevated": 1, "alert": 2}
    worst = max((order[e.status] for e in estimates), default=0)
    return ["normal", "elevated", "alert"][worst]


def ingest(reading: SensorReading) -> LiveUpdate:
    """Run the full pipeline for one reading and record everything."""
    estimates = predict(reading)
    attribution = attribute(
        reading.buoy_id, reading.lake_id, estimates, reading.timestamp
    )
    overall = _overall_status(estimates)

    _readings[reading.buoy_id].append(reading)
    _estimates[reading.buoy_id].append(estimates)
    _status[reading.buoy_id] = overall
    if reading.buoy_id in BUOYS:
        BUOYS[reading.buoy_id]["status"] = overall
    if attribution and attribution.status == "flagged":
        _attribution[reading.buoy_id] = attribution

    return LiveUpdate(
        reading=reading,
        estimates=estimates,
        attribution=attribution if (attribution and attribution.status == "flagged") else None,
        overall_status=overall,
    )


def seed() -> None:
    """Populate the store with simulated history (idempotent-ish)."""
    if _readings:
        return
    history = seed_history()
    # Process oldest-first so latest state is correct.
    merged: list[SensorReading] = []
    for buoy_readings in history.values():
        merged.extend(buoy_readings)
    merged.sort(key=lambda r: r.timestamp)
    for r in merged:
        ingest(r)


# --- read helpers used by routers ------------------------------------------
def latest_update(buoy_id: str) -> Optional[LiveUpdate]:
    if buoy_id not in _readings or not _readings[buoy_id]:
        return None
    reading = _readings[buoy_id][-1]
    estimates = _estimates[buoy_id][-1]
    return LiveUpdate(
        reading=reading,
        estimates=estimates,
        attribution=_attribution.get(buoy_id),
        overall_status=_status.get(buoy_id, "normal"),
    )


def history_for(buoy_id: str, limit: int = MAX_PER_BUOY) -> list[dict]:
    """Time series of concentrations per metal for the Trends view."""
    out: list[dict] = []
    readings = list(_readings.get(buoy_id, []))[-limit:]
    estimates = list(_estimates.get(buoy_id, []))[-limit:]
    for reading, ests in zip(readings, estimates):
        row = {"timestamp": reading.timestamp.isoformat()}
        for e in ests:
            row[e.metal] = e.estimated_concentration
        out.append(row)
    return out


def attribution_for(buoy_id: str) -> Optional[AttributionResult]:
    return _attribution.get(buoy_id)


def all_attributions() -> list[AttributionResult]:
    return [a for a in _attribution.values() if a.status == "flagged"]


def status_of(buoy_id: str) -> str:
    return _status.get(buoy_id, "normal")
