# MetalDetect

**Live heavy-metal water monitoring** — distributed electrochemical buoys stream
telemetry from Tamil Nadu's rivers; an ML layer estimates per-metal
concentrations, a transparent rule-based layer attributes contamination spikes to
candidate sources, and an interactive 3D dashboard makes it all legible in real
time.

Everything runs **offline** (no external API keys) with **simulated** buoy data
that matches the real LoRaWAN payload contract, so physical hardware can be
swapped in later with no code change. All data in this phase is
synthetic/illustrative — surfaced honestly in the UI.

---

## Tech stack

### Frontend — `frontend/`
| Area | Tech |
|---|---|
| Framework | **Next.js 16.3.1** (App Router, Turbopack), **React 19**, **TypeScript** |
| Styling | **Tailwind CSS 4** + CSS variables (four-colour deep-blue palette) |
| 3D | **three.js**, **@react-three/fiber**, **@react-three/drei** — globe (GLB + night texture) and the animated buoy/water scene |
| WebGL shaders | **ogl** — `AcidSquares` (Overview background) and `DarkVeil` (ambient tab background) |
| Animation | **GSAP** + ScrollTrigger (`ScrollReveal`), **Framer Motion** (`AnimatedList`), bespoke `CardSwap`, `VariableProximity`, `BallCursor` |
| Maps | **Leaflet** (Esri World Imagery satellite tiles) |
| Charts | **Recharts** |
| Data | **@tanstack/react-query** (REST) + a WebSocket live-feed hook |
| Fonts | Space Grotesk (display), Sora (body), JetBrains Mono (telemetry), Coolvetica (hero) |

**Routes:** `/overview` (3D globe hero), `/network` (satellite map + status-coded
nodes), `/alerts` (source attribution), `/trends` (per-metal history), `/conservers`
(least-harmful-industry leaderboard), `/lake/[id]` (drill-down buoy detail). `/`
redirects to `/overview`. A boot **loading screen** covers the cold start (fonts +
three.js + GLB + shaders) and "opens" once the page is ready.

### Backend — `backend/`
| Area | Tech |
|---|---|
| API | **FastAPI** + **Uvicorn**, REST + a `WS /live` feed |
| ML | **scikit-learn** `GradientBoostingRegressor` — one regressor per metal (Pb, Cr, Ni, Cu, Cd, Zn); **XGBoost** optional (auto-fallback) |
| Data | **NumPy**, **Pandas**, **joblib** (model persistence), **Pydantic** (schemas) |
| Simulation | background task emits a plausible reading per buoy every few seconds, seeds ~48 h of history on startup |

**Endpoints:** `GET /health`, `/metals`, `/lakes`, `/lakes/{id}`,
`/buoys/{id}/latest`, `/buoys/{id}/history`, `/attribution`, `/attribution/{id}`,
`POST /ingest`, `WS /live`.

---

## Run it (two terminals)

**1 · Backend** (from `backend/`)
```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m ml.train      # trains the 6 models (~10s); models ship pre-trained too
.\run.ps1                                    # http://127.0.0.1:8000
```

**2 · Frontend** (from `frontend/`)
```bash
npm install
npm run dev                                  # http://localhost:3000
```

Open **http://localhost:3000**. Use the left nav wheel to move between Overview,
Live Network, Alerts, Trends and Conservers. Click a map node to drill into its
**Lake Detail**.

---

## Deployment

The frontend and backend deploy independently.

**Frontend** (e.g. Vercel):
```bash
cd frontend
npm run build      # production build
npm run start      # or let the host run it
```
Set the backend URLs as environment variables (see `frontend/.env.example`):
- `NEXT_PUBLIC_API_BASE` — backend REST base (e.g. `https://api.example.com`)
- `NEXT_PUBLIC_WS_URL` — backend WebSocket (`wss://api.example.com/live` over https)

**Backend** (any Python host / container):
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```
CORS is currently open (`allow_origins=["*"]`) for the demo — restrict it to your
frontend origin before a real deployment.

The UI **degrades gracefully** when the backend is unreachable: REST calls fall
back to empty states and the WebSocket auto-reconnects, so the frontend never
crashes on its own.

---

## Environment notes

- **XGBoost/NumPy on Python 3.14** — the trainer falls back to scikit-learn's
  `GradientBoostingRegressor` if no XGBoost wheel exists. Set
  `OPENBLAS_NUM_THREADS=1` (already done in `backend/run.ps1`) to avoid an
  OpenBLAS thread-allocation error on constrained setups.
- **npm cache on a full C: drive** — if `npm install` fails with `ENOSPC`,
  redirect the cache: `$env:npm_config_cache="D:\npm-cache"; npm install`.

All data is synthetic/illustrative for this phase; the Alerts view carries the
"flagged for investigation, not a determination of responsibility" disclaimer.
