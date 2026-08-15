"""Simulated buoy telemetry (PRD 9 / 12).

Stands in for real LoRaWAN uplinks while emitting the exact `SensorReading`
contract, so hardware can be swapped in later with no backend change. Produces:

* a live stream (one reading per buoy every few seconds), with occasional
  rainfall-driven contamination spikes so the demo has real events to key off
* a seeded ~48h history so the Trends view has data on first load

SWV current is generated from a "true" concentration via the same Langmuir
curve the model was trained against, so predictions track the injected truth.
"""
from __future__ import annotations

import os

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

from datetime import datetime, timedelta, timezone

import numpy as np

from config import HISTORY_HOURS, HISTORY_STEP_MINUTES, METAL_RANGES, METALS
from data.sites import BUOYS, SETPOINTS
from ml.generate_dataset import LANGMUIR
from schemas import SensorReading

RNG = np.random.default_rng(7)


class BuoyState:
    """Slowly-wandering true concentration per metal for one buoy."""

    def __init__(self, buoy_id: str, lake_id: str):
        self.buoy_id = buoy_id
        self.lake_id = lake_id
        base = SETPOINTS.get(lake_id, {})
        self.true_conc = {m: float(base.get(m, METAL_RANGES[m]["baseline"])) for m in METALS}
        self.age_days = 40.0 + RNG.uniform(0, 20)
        self.spike_metal: str | None = None
        self.spike_ttl = 0

    def _step_concentration(self) -> None:
        for m in METALS:
            r = METAL_RANGES[m]
            # gentle mean-reverting random walk toward baseline
            drift = (r["baseline"] - self.true_conc[m]) * 0.05
            self.true_conc[m] += drift + RNG.normal(0, r["baseline"] * 0.08)
            self.true_conc[m] = float(np.clip(self.true_conc[m], 0, r["max"]))

        # Occasionally start a spike event (rainfall-driven runoff).
        if self.spike_ttl <= 0 and RNG.random() < 0.06:
            self.spike_metal = str(RNG.choice(METALS))
            self.spike_ttl = int(RNG.integers(4, 9))
        if self.spike_ttl > 0 and self.spike_metal:
            r = METAL_RANGES[self.spike_metal]
            self.true_conc[self.spike_metal] = float(
                np.clip(self.true_conc[self.spike_metal] * 1.6 + r["alert"] * 0.5, 0, r["max"])
            )
            self.spike_ttl -= 1

    def reading(self, ts: datetime, advance: bool = True) -> SensorReading:
        if advance:
            self._step_concentration()
            self.age_days += HISTORY_STEP_MINUTES / (60 * 24)

        drift = 0.0008 * self.age_days
        pH = float(RNG.normal(7.4, 0.3))
        conductivity = float(RNG.normal(480, 60))
        water_temp = float(RNG.normal(29.0, 1.2))
        battery = float(np.clip(RNG.normal(3.95, 0.08), 3.4, 4.2))

        swv = {}
        for m in METALS:
            p = LANGMUIR[m]
            c = self.true_conc[m]
            signal = p["base"] + p["i_max"] * c / (p["kd"] + c)
            signal *= 1.0 + 0.04 * (pH - 7.4)
            signal *= 1.0 + 0.0003 * (conductivity - 480)
            signal *= 1.0 + 0.008 * (water_temp - 29.0)
            signal += drift + RNG.normal(0, 0.05)
            swv[m] = round(float(signal), 4)

        return SensorReading(
            buoy_id=self.buoy_id,
            lake_id=self.lake_id,
            timestamp=ts,
            swv_readings=swv,
            pH=round(pH, 2),
            conductivity=round(conductivity, 1),
            water_temp=round(water_temp, 2),
            battery_voltage=round(battery, 3),
            ref_electrode_drift=round(drift, 4),
            sensor_age_days=round(self.age_days, 2),
        )


# One persistent state object per buoy.
STATES: dict[str, BuoyState] = {
    bid: BuoyState(bid, b["lake_id"]) for bid, b in BUOYS.items()
}


def seed_history() -> dict[str, list[SensorReading]]:
    """Generate ~HISTORY_HOURS of back-dated readings per buoy for Trends."""
    now = datetime.now(timezone.utc)
    steps = int(HISTORY_HOURS * 60 / HISTORY_STEP_MINUTES)
    history: dict[str, list[SensorReading]] = {bid: [] for bid in BUOYS}
    # Use fresh states so live stream continues from a clean baseline.
    states = {bid: BuoyState(bid, b["lake_id"]) for bid, b in BUOYS.items()}
    for i in range(steps, 0, -1):
        ts = now - timedelta(minutes=i * HISTORY_STEP_MINUTES)
        for bid, st in states.items():
            history[bid].append(st.reading(ts))
    return history


def next_reading(buoy_id: str) -> SensorReading:
    return STATES[buoy_id].reading(datetime.now(timezone.utc))
