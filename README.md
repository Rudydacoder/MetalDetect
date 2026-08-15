# MetalDetect

### 🔗 [**View the live project →**](https://metal-detect.vercel.app/overview)

**Live heavy-metal water monitoring** — distributed electrochemical buoys stream
telemetry from Tamil Nadu's rivers; an ML layer estimates per-metal
concentrations, a transparent rule-based layer attributes contamination spikes to
candidate sources, and an interactive 3D dashboard makes it all legible in real
time.

All buoy data is **simulated** but matches the real LoRaWAN payload contract, so
physical hardware can be swapped in later with no code change. Every external
service used is **free and key-free** — there are no API keys to configure
anywhere in this project.

---

## Specifications

### Project
| | |
|---|---|
| Monitored sites | 11 rivers, Tamil Nadu + neighbouring states |
| Buoys | 11 (one per site) |
| Tracked metals | Pb, Cr, Ni, Cu, Cd, Zn |
| Sensor cadence | 15-minute steps; ~48 h of history seeded on startup |
| Frontend routes | 7 pages (`/overview`, `/network`, `/alerts`, `/trends`, `/conservers`, `/lake/[id]`, `/` redirect) |
| Frontend components | 20 (`frontend/components/`) |
| Demo API routes | 8 (`frontend/app/api/`), mirroring the backend REST contract |
| Backend endpoints | 10 REST + 1 WebSocket (`backend/main.py`) |
| External services | Open-Meteo (weather), Esri World Imagery (satellite tiles) — both free, key-free |

### System requirements
| | Build / dev | Running |
|---|---|---|
| **Frontend** (Next.js) | **4 GB free RAM recommended** for `next build` (Turbopack's static-generation workers are memory-hungry; this repo has OOM'd on a machine with <2 GB free) | ~180–250 MB RSS for the Node server, measured under light load |
| **Backend** (FastAPI) | ~1 GB free RAM to install + train (NumPy/Pandas/scikit-learn) | ~200 MB RSS at idle with models loaded, measured under light load |
| Disk — frontend | `node_modules` ~600 MB+; production output (`​.next/server` + `.next/static`, what actually ships) ≈ 25 MB | |
| Disk — backend | `.venv` a few hundred MB; trained models (`data/models/*.joblib`) ~3 MB total; synthetic dataset CSV a few MB | |
| Node.js | 20+ (tested on 24.11) | |
| Python | 3.11–3.14 (tested on 3.14; see XGBoost note below) | |

These are measured, not vendor-quoted figures — see Verification below. Any
modern laptop or a free-tier cloud instance (Render/Railway starter tiers are
512 MB–1 GB) comfortably runs the backend; the frontend build is the only step
that benefits from more RAM.

### Dependencies
- **Frontend** (`frontend/package.json`): 13 runtime deps, 8 dev deps. Key ones:
  `next` 16.3.1, `react`/`react-dom` 19.2.8, `three` + `@react-three/fiber` +
  `@react-three/drei`, `ogl`, `gsap`, `framer-motion`, `leaflet`, `recharts`,
  `@tanstack/react-query`, `typescript`, `tailwindcss` 4.
- **Backend** (`backend/requirements.txt`): `fastapi`, `uvicorn[standard]`,
  `numpy`, `pandas`, `scikit-learn`, `joblib`, `pydantic`. `xgboost` is optional
  (commented out) — the trainer falls back to scikit-learn's
  `GradientBoostingRegressor` automatically if it isn't installed.

---

## Two ways to run it

The frontend works **with or without** the Python backend:

| Mode | How | What it uses |
|---|---|---|
| **Demo mode** (default) | Just deploy/run the frontend. No configuration. | Built-in simulated data layer served from Next.js route handlers under `/api`, plus live weather from Open-Meteo. Live feed polls every 5 s. |
| **Full stack** | Set `NEXT_PUBLIC_API_BASE` to a running FastAPI service. | The real FastAPI backend: trained scikit-learn models, rule-based attribution and a true WebSocket live feed. |

The frontend switches automatically based on that one environment variable —
this is what makes the Vercel deployment work with zero setup, while still
letting the real Python ML pipeline run when the backend is available.

> The built-in demo layer does **not** run the trained scikit-learn models — it
> inverts the same Langmuir sensor curve those models were fitted to, and mirrors
> the backend's attribution scoring exactly. Point the app at the real backend to
> exercise the actual ML pipeline.

---

## Tech stack

### Frontend — `frontend/`
| Area | Technology |
|---|---|
| Framework | **Next.js 16.3.1** (App Router, Turbopack), **React 19**, **TypeScript** |
| Styling | **Tailwind CSS 4** + CSS variables (four-colour deep-blue palette) |
| 3D | **three.js**, **@react-three/fiber**, **@react-three/drei** — GLB globe and animated buoy/water scene |
| WebGL shaders | **ogl** — `AcidSquares` (Overview background), `DarkVeil` (ambient tab background), `MetallicPaint` (liquid-metal logo) |
| Animation | **GSAP** + ScrollTrigger (`ScrollReveal`), **Framer Motion** (`AnimatedList`), bespoke `CardSwap`, `VariableProximity`, `BallCursor` |
| Maps | **Leaflet** + Esri World Imagery satellite tiles (free, key-free) |
| Charts | **Recharts** |
| Data | **@tanstack/react-query** (REST) + a live-feed hook (WebSocket or polling) |
| Demo data layer | Next.js route handlers under `app/api/` backed by `lib/demo/` |
| Fonts | Space Grotesk (display), Sora (body), JetBrains Mono (telemetry), Coolvetica (hero) |

### Backend — `backend/`
| Area | Technology |
|---|---|
| API | **FastAPI** + **Uvicorn**, REST + a `WS /live` feed |
| ML | **scikit-learn** `GradientBoostingRegressor` — one regressor per metal (Pb, Cr, Ni, Cu, Cd, Zn); **XGBoost** optional (auto-fallback) |
| Data | **NumPy**, **Pandas**, **joblib** (model persistence), **Pydantic** (schemas) |
| Simulation | Background task emits a reading per buoy every few seconds; seeds ~48 h of history on startup |

### External APIs (all free, open, no keys)
| Service | Used for | Why |
|---|---|---|
| **[Open-Meteo](https://open-meteo.com)** | Live ambient temperature + 24 h rainfall per lake | Open-source weather API built on open government data (DWD/NOAA/ECMWF). **No API key.** Used by both the backend (`backend/utils/weather.py`) and the demo layer (`frontend/lib/demo/weather.ts`), batched into one request for all 11 lakes, cached 15 min, with a static seasonal fallback if unreachable. |
| **[OpenStreetMap](https://www.openstreetmap.org) / Esri World Imagery** | Satellite map tiles | Key-free tile services. |

> **Note:** OpenRouter is an LLM gateway (it routes to Claude/GPT/Llama), not a
> weather source, so it isn't used here — Open-Meteo is the open, key-free
> weather API.

---

## Routes

`/overview` (3D globe hero) · `/network` (satellite map + status-coded nodes) ·
`/alerts` (source attribution) · `/trends` (per-metal history) · `/conservers`
(least-harmful-operator leaderboard) · `/lake/[id]` (buoy drill-down). `/`
redirects to `/overview`.

A boot **loading screen** covers the cold start (fonts + three.js + GLB +
shaders) and opens once ready; the four heaviest screens have their own buffers.

---

## Run locally

**Frontend only** (demo mode — nothing else needed):
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```

**With the real backend** (two terminals):
```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m ml.train      # trains the 6 models (~10s)
.\run.ps1                                    # http://127.0.0.1:8000
```
Then set `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000` in `frontend/.env.local`
and restart `npm run dev`.

---

## Deployment

**Frontend (Vercel):** Root Directory = `frontend`; Framework auto-detects as
Next.js; no environment variables required — the site runs in demo mode with
live weather and no cold start. Live at https://metal-detect.vercel.app.

**Backend (optional, for the real ML pipeline):** Vercel cannot host it — it
needs a long-lived WebSocket and a background simulator loop, neither of which
serverless functions support. Deploy `backend/` to a host with long-running
processes (Render, Railway, Fly.io: `pip install -r requirements.txt && python
-m ml.train` to build, `uvicorn main:app --host 0.0.0.0 --port $PORT` to run),
then set `NEXT_PUBLIC_API_BASE` on Vercel to that URL. `NEXT_PUBLIC_WS_URL` is
derived automatically.

CORS in `backend/main.py` is restricted to the production origin
(`https://metal-detect.vercel.app`) and `http://localhost:3000` for local dev —
update it if the deployment domain changes. Free-tier backend hosts typically
sleep after ~15 min idle (~50 s cold start on first request); demo mode has no
such cold start and is the safer default for a live presentation.

---

## Regenerating the demo data

`frontend/lib/demo/sites.generated.ts` is generated from the Python backend so
the two never drift. After editing `backend/data/sites.py` or `backend/config.py`:

```bash
./backend/.venv/Scripts/python.exe scripts/gen-demo-data.py
```

---

## Environment notes

- **XGBoost/NumPy on Python 3.14** — the trainer falls back to scikit-learn's
  `GradientBoostingRegressor` if no XGBoost wheel exists. Set
  `OPENBLAS_NUM_THREADS=1` (already done in `backend/run.ps1`) to avoid an
  OpenBLAS thread-allocation error.
- **npm cache on a full C: drive** — if `npm install` fails with `ENOSPC`,
  redirect the cache: `$env:npm_config_cache="D:\npm-cache"; npm install`.
- **`next build` needs headroom** — Turbopack's static-generation workers have
  OOM'd on this project when free system RAM dropped below ~1 GB. If a local
  build crashes with `FATAL ERROR: ... out of memory`, free up RAM (close other
  apps/tabs) and retry; Vercel's build machines aren't affected by this.

---

## Data & ethics disclosure

All buoy readings, attribution candidates and company names are synthetic and
illustrative. The Alerts view carries a persistent disclaimer: results are
flagged for investigation, not a determination of responsibility, and industrial
source markers are fictional. No real company or individual is identified or
ranked. Weather is the only real-world data in the system.
