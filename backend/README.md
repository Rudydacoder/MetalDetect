# MetalDetect Backend

FastAPI + XGBoost service that simulates buoy telemetry, estimates heavy-metal
concentrations, and runs rule-based source attribution — all offline (no
external API keys needed). Matches the LoRaWAN payload contract so real hardware
can be swapped in with no code change.

## Setup (once)

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt   # xgboost optional
.\.venv\Scripts\python.exe -m ml.train                          # trains 6 models
```

If XGBoost has no wheel for your Python, training automatically falls back to
scikit-learn's GradientBoostingRegressor — same interface, nothing else changes.

## Run

```powershell
.\run.ps1                      # http://127.0.0.1:8000  (auto-reload)
```

The server seeds ~48h of history on startup and streams a fresh reading per buoy
every few seconds.

## Key endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness + metal/buoy list |
| GET | `/lakes` | sites + buoys + status |
| GET | `/lakes/{id}` | one lake + candidate sources + weather |
| GET | `/buoys/{id}/latest` | latest reading + estimates + attribution |
| GET | `/buoys/{id}/history` | concentration time series (Trends) |
| GET | `/attribution` | all currently-flagged results (Alerts) |
| POST | `/ingest` | accept a `SensorReading` (real or simulated) |
| WS | `/live` | pushes a `LiveUpdate` on every new reading |

## Notes

- Metals: Pb, Cr, Ni, Cu, Cd, Zn (Noyyal river basin literature).
- All data is **synthetic / illustrative** for demo purposes (PRD §5.4, §9.3).
- `OPENBLAS_NUM_THREADS=1` is set in `run.ps1` to avoid an OpenBLAS thread
  allocation error seen on some constrained setups.
