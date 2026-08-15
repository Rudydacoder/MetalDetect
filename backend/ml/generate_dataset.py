"""Synthetic training-data generator (PRD 5.4).

Builds a physically-plausible dataset rather than pure noise, so the demo model
behaves sensibly:

* base concentration sampled per metal across a realistic range
* SWV peak current follows a saturating (Langmuir-type) binding curve of
  concentration, with Gaussian noise
* pH / conductivity / temperature perturb the SWV signal (confounders the model
  learns to partially compensate for)
* reference-electrode drift and sensor age injected as slow monotonic baseline
  shifts over simulated deployment time
* rainfall occasionally injects a contamination spike event

Run directly to (re)generate `data/synthetic_readings.csv`.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from config import DATASET_CSV, METAL_RANGES, METALS

RNG = np.random.default_rng(42)

# Per-metal Langmuir parameters: I = i_max * C / (K_d + C) + baseline
# i_max in uA, K_d in ug/L. Chosen so signal saturates within the plotted range.
LANGMUIR = {
    "Pb": {"i_max": 3.2, "kd": 40.0, "base": 0.15},
    "Cr": {"i_max": 2.8, "kd": 55.0, "base": 0.12},
    "Ni": {"i_max": 2.5, "kd": 45.0, "base": 0.10},
    "Cu": {"i_max": 3.0, "kd": 50.0, "base": 0.14},
    "Cd": {"i_max": 3.6, "kd": 8.0, "base": 0.18},
    "Zn": {"i_max": 2.2, "kd": 90.0, "base": 0.09},
}


def _langmuir_current(metal: str, conc: np.ndarray) -> np.ndarray:
    p = LANGMUIR[metal]
    return p["base"] + p["i_max"] * conc / (p["kd"] + conc)


def generate(n_per_metal: int = 4000) -> pd.DataFrame:
    rows = []
    for metal in METALS:
        r = METAL_RANGES[metal]
        n = n_per_metal

        # Concentration: mostly around baseline, with a heavy tail toward alerts.
        base = RNG.gamma(shape=2.0, scale=r["baseline"] / 2.0, size=n)
        conc = np.clip(base, 0, r["max"])

        # Rainfall-driven spike events (~12% of samples) push concentration up.
        rainfall = RNG.gamma(shape=1.5, scale=6.0, size=n)  # mm/24h
        spike_mask = rainfall > 15.0
        conc[spike_mask] *= RNG.uniform(1.8, 3.5, size=spike_mask.sum())
        conc = np.clip(conc, 0, r["max"])

        # Environmental confounders.
        pH = RNG.normal(7.4, 0.5, size=n)
        conductivity = RNG.normal(480, 120, size=n)          # uS/cm
        water_temp = RNG.normal(29.0, 2.5, size=n)           # deg C
        ambient_temp = water_temp + RNG.normal(2.0, 1.5, size=n)
        battery_voltage = RNG.normal(3.9, 0.15, size=n)

        # Slow monotonic deployment effects.
        sensor_age = RNG.uniform(0, 180, size=n)             # days
        drift = 0.0008 * sensor_age + RNG.normal(0, 0.01, size=n)

        # Ideal electrochemical signal, then confounder perturbation.
        swv = _langmuir_current(metal, conc)
        swv *= 1.0 + 0.04 * (pH - 7.4)                       # folding stability
        swv *= 1.0 + 0.0003 * (conductivity - 480)          # ionic strength
        swv *= 1.0 + 0.008 * (water_temp - 29.0)            # kinetics
        swv += drift                                         # baseline drift
        swv *= 1.0 - 0.05 * np.maximum(0, 3.9 - battery_voltage)  # low battery
        swv += RNG.normal(0, 0.06, size=n)                   # measurement noise

        rows.append(
            pd.DataFrame(
                {
                    "metal": metal,
                    "swv_current": swv,
                    "pH": pH,
                    "conductivity": conductivity,
                    "water_temp": water_temp,
                    "battery_voltage": battery_voltage,
                    "ref_electrode_drift": drift,
                    "sensor_age_days": sensor_age,
                    "ambient_temp": ambient_temp,
                    "rainfall_24h": rainfall,
                    "concentration": conc,  # label
                }
            )
        )

    df = pd.concat(rows, ignore_index=True)
    return df


if __name__ == "__main__":
    DATASET_CSV.parent.mkdir(parents=True, exist_ok=True)
    df = generate()
    df.to_csv(DATASET_CSV, index=False)
    print(f"Wrote {len(df):,} rows to {DATASET_CSV}")
    print(df.groupby("metal")["concentration"].describe()[["mean", "min", "max"]])
