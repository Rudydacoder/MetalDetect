"""Feature enrichment + inference (PRD 3.2 steps 4-5).

Loads the per-metal models trained by `ml.train` and converts a raw
`SensorReading` into per-metal `ConcentrationEstimate`s. If models are missing
they are trained on first use so the server always comes up demo-ready.
"""
from __future__ import annotations

import os

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import numpy as np
import joblib

from config import (
    METAL_NAMES,
    METALS,
    MODEL_VERSION,
    MODELS_DIR,
    status_for,
)
from data.sites import WEATHER
from ml.train import FEATURES, train
from schemas import ConcentrationEstimate, SensorReading

_MODELS: dict[str, dict] = {}


def _ensure_models() -> None:
    global _MODELS
    if _MODELS:
        return
    if not all((MODELS_DIR / f"{m}.joblib").exists() for m in METALS):
        train()
    _MODELS = {m: joblib.load(MODELS_DIR / f"{m}.joblib") for m in METALS}


def _feature_vector(reading: SensorReading, metal: str) -> np.ndarray:
    """Assemble the model feature vector for one metal channel.

    Enriches the raw payload with mock ambient/rainfall context (PRD 3.2 #4).
    """
    weather = WEATHER.get(reading.lake_id, {"ambient_temp": 30.0, "rainfall_24h": 0.0})
    values = {
        "swv_current": reading.swv_readings.get(metal, 0.0),
        "pH": reading.pH,
        "conductivity": reading.conductivity,
        "water_temp": reading.water_temp,
        "battery_voltage": reading.battery_voltage,
        "ref_electrode_drift": reading.ref_electrode_drift,
        "sensor_age_days": reading.sensor_age_days,
        "ambient_temp": weather["ambient_temp"],
        "rainfall_24h": weather["rainfall_24h"],
    }
    return np.array([[values[f] for f in FEATURES]], dtype=float)


def predict(reading: SensorReading) -> list[ConcentrationEstimate]:
    _ensure_models()
    estimates: list[ConcentrationEstimate] = []
    for metal in METALS:
        bundle = _MODELS[metal]
        x = _feature_vector(reading, metal)
        conc = float(bundle["model"].predict(x)[0])
        conc = max(0.0, conc)
        estimates.append(
            ConcentrationEstimate(
                metal=metal,
                metal_name=METAL_NAMES[metal],
                estimated_concentration=round(conc, 2),
                status=status_for(metal, conc),
                model_version=MODEL_VERSION,
            )
        )
    return estimates
