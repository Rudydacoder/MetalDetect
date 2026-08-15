"""Train one concentration regressor per metal (PRD 5.1-5.5).

Uses XGBoost when available (the PRD's choice) and transparently falls back to
scikit-learn's GradientBoostingRegressor otherwise, behind an identical
persisted-model interface so nothing downstream cares which was used.

Run:  python -m ml.train      (from the backend/ directory)
"""
from __future__ import annotations

import os

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from config import DATASET_CSV, METALS, MODEL_VERSION, MODELS_DIR
from ml.generate_dataset import generate

# Feature columns, in a fixed order shared with the inference pipeline.
FEATURES = [
    "swv_current",
    "pH",
    "conductivity",
    "water_temp",
    "battery_voltage",
    "ref_electrode_drift",
    "sensor_age_days",
    "ambient_temp",
    "rainfall_24h",
]

try:
    from xgboost import XGBRegressor

    BACKEND = "xgboost"
except Exception:  # pragma: no cover - depends on install
    from sklearn.ensemble import GradientBoostingRegressor

    BACKEND = "sklearn"


def _make_model():
    if BACKEND == "xgboost":
        return XGBRegressor(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            n_jobs=1,
            random_state=42,
        )
    return GradientBoostingRegressor(
        n_estimators=300, max_depth=3, learning_rate=0.05, random_state=42
    )


def train() -> None:
    if DATASET_CSV.exists():
        df = pd.read_csv(DATASET_CSV)
    else:
        df = generate()
        DATASET_CSV.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(DATASET_CSV, index=False)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Training with backend: {BACKEND}  (model_version={MODEL_VERSION})\n")
    print(f"{'metal':6} {'RMSE':>8} {'R2':>7}   top features")
    print("-" * 60)

    for metal in METALS:
        sub = df[df["metal"] == metal]
        X = sub[FEATURES].to_numpy()
        y = sub["concentration"].to_numpy()
        X_tr, X_te, y_tr, y_te = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = _make_model()
        model.fit(X_tr, y_tr)
        pred = model.predict(X_te)
        rmse = float(np.sqrt(mean_squared_error(y_te, pred)))
        r2 = float(r2_score(y_te, pred))

        importances = getattr(model, "feature_importances_", None)
        if importances is not None:
            order = np.argsort(importances)[::-1][:3]
            top = ", ".join(f"{FEATURES[i]}={importances[i]:.2f}" for i in order)
        else:
            top = "n/a"

        joblib.dump(
            {
                "model": model,
                "features": FEATURES,
                "metal": metal,
                "backend": BACKEND,
                "model_version": MODEL_VERSION,
                "metrics": {"rmse": rmse, "r2": r2},
            },
            MODELS_DIR / f"{metal}.joblib",
        )
        print(f"{metal:6} {rmse:8.2f} {r2:7.3f}   {top}")

    print("\nSanity check: swv_current should dominate feature importance.")
    print(f"Saved {len(METALS)} models to {MODELS_DIR}")


if __name__ == "__main__":
    train()
