# MetalDetect

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

## Two ways to run it

The frontend works **with or without** the Python backend:

| Mode | How | What it uses |
|---|---|---|
| **Demo mode** (default) | Just deploy/run the frontend. No configuration. | Built-in simulated data layer served from Next.js route handlers under `/api`, plus live weather from Open-Meteo. Live feed polls every 5 s. |
| **Full stack** | Set `NEXT_PUBLIC_API_BASE` to a running FastAPI service. | The real FastAPI backend: trained scikit-learn models, rule-based attribution and a true WebSocket live feed. |

The frontend switches automatically based on that one environment variable. This
is what makes the Vercel deployment work with zero setup, while still letting you
demo the real Python ML pipeline when the backend is running.

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
| **[OpenStreetMap](https://www.openstreetmap.org) / Esri World Imagery** | Satellite map tiles | Key-free tile services. Swap the tile URL in `frontend/components/SatelliteMap.tsx` for plain OSM if you prefer fully open map data over satellite imagery. |

> **Note:** OpenRouter is an LLM gateway (it routes to Claude/GPT/Llama) and does
> not provide weather data, so it isn't used here. Open-Meteo is the open,
> key-free weather source.

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
Then create `frontend/.env.local`:
```
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```
and restart `npm run dev`.

---

## Deployment roadmap (Vercel)

You've already imported the repo into the Vercel dashboard. Do this:

### Step 1 — Set the Root Directory (required)
This repo has `frontend/` and `backend/` side by side, so Vercel must be told
where the Next.js app lives.

In your Vercel project: **Settings → Build and Deployment → Root Directory** →
set to `frontend` → **Save**.

Framework Preset should auto-detect as **Next.js**. Leave Build Command, Output
Directory and Install Command on their defaults.

### Step 2 — Deploy
**Deployments → Redeploy** (or push any commit to `main`).

That's it — the site is now fully working in demo mode. Every screen has live
data, weather comes from Open-Meteo, and there are **no environment variables to
set**. Verify at `https://<your-app>.vercel.app/api/health` — it should report
`"mode":"demo"` and `"weather_source":"open-meteo"`.

### Step 3 (optional) — Add the real Python backend
Vercel **cannot** host the FastAPI service: it needs a long-lived WebSocket and a
background simulator loop, neither of which work on serverless functions. Deploy
it to a host that supports long-running processes — [Render](https://render.com)
free tier is the simplest:

1. Render → **New → Web Service** → connect the same GitHub repo.
2. **Root Directory:** `backend`
3. **Build Command:** `pip install -r requirements.txt && python -m ml.train`
4. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Deploy, then copy the service URL (e.g. `https://metaldetect-api.onrender.com`).

Then in Vercel: **Settings → Environment Variables** → add

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE` | `https://metaldetect-api.onrender.com` |

Redeploy. The frontend now uses the real models and a live WebSocket. (`NEXT_PUBLIC_WS_URL`
is derived automatically — only set it if your WS lives on a different host.)

Before going live, tighten CORS in `backend/main.py` — it currently uses
`allow_origins=["*"]` for the demo. Replace with your Vercel domain.

### Step 4 — Demo-day checklist
- Render's free tier **sleeps after ~15 min idle** and takes ~50 s to wake. Hit
  the backend URL a few minutes before demoing, or stay in demo mode (which has
  no cold start) for the actual presentation.
- To force demo mode at any time, delete `NEXT_PUBLIC_API_BASE` in Vercel and
  redeploy — the site keeps working regardless of backend state.

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

---

## Data & ethics disclosure

All buoy readings, attribution candidates and company names are synthetic and
illustrative. The Alerts view carries a persistent disclaimer: results are
flagged for investigation, not a determination of responsibility, and industrial
source markers are fictional. No real company or individual is identified or
ranked. Weather is the only real-world data in the system.
