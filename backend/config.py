"""Central constants shared across the MetalDetect backend.

Keeping the metal list, thresholds and file paths in one place means the
dataset generator, trainer, inference pipeline and attribution layer never
drift out of sync.
"""
from __future__ import annotations

from pathlib import Path

# --- Target metals (per PRD 9.2, Noyyal river basin literature) -------------
METALS: list[str] = ["Pb", "Cr", "Ni", "Cu", "Cd", "Zn"]

METAL_NAMES: dict[str, str] = {
    "Pb": "Lead",
    "Cr": "Chromium",
    "Ni": "Nickel",
    "Cu": "Copper",
    "Cd": "Cadmium",
    "Zn": "Zinc",
}

# Typical / elevated freshwater concentration ranges in ug/L, informed by
# published Indian river studies. Used both to generate the synthetic dataset
# and to colour-code readings in the UI.
#   baseline   -> normal background level
#   elevated   -> "watch" threshold (amber)
#   alert      -> contamination threshold (red, triggers attribution)
METAL_RANGES: dict[str, dict[str, float]] = {
    "Pb": {"baseline": 5.0, "elevated": 15.0, "alert": 30.0, "max": 120.0},
    "Cr": {"baseline": 8.0, "elevated": 25.0, "alert": 50.0, "max": 200.0},
    "Ni": {"baseline": 6.0, "elevated": 20.0, "alert": 40.0, "max": 150.0},
    "Cu": {"baseline": 10.0, "elevated": 30.0, "alert": 60.0, "max": 180.0},
    "Cd": {"baseline": 1.0, "elevated": 3.0, "alert": 6.0, "max": 25.0},
    "Zn": {"baseline": 20.0, "elevated": 60.0, "alert": 120.0, "max": 400.0},
}

# --- Paths ------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data"
MODELS_DIR = DATA_DIR / "models"
DATASET_CSV = DATA_DIR / "synthetic_readings.csv"

MODEL_VERSION = "synthetic-v1"

# --- Simulator --------------------------------------------------------------
SIM_INTERVAL_SECONDS = 4.0      # how often each buoy emits a new reading
HISTORY_HOURS = 48              # hours of history seeded on startup
HISTORY_STEP_MINUTES = 15       # cadence of the real buoy (PRD 4.2)


def status_for(metal: str, concentration: float) -> str:
    """Map a concentration to a traffic-light status used across the UI."""
    r = METAL_RANGES[metal]
    if concentration >= r["alert"]:
        return "alert"
    if concentration >= r["elevated"]:
        return "elevated"
    return "normal"
