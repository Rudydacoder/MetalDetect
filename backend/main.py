"""MetalDetect FastAPI backend.

Endpoints
  GET  /health
  GET  /lakes                     list of monitored water bodies + buoys
  GET  /lakes/{lake_id}           single lake with candidate sources + weather
  GET  /buoys/{buoy_id}/latest    latest reading + estimates + attribution
  GET  /buoys/{buoy_id}/history   concentration time series (Trends)
  GET  /attribution               all currently-flagged results (Alerts)
  GET  /attribution/{buoy_id}     latest attribution for one buoy
  POST /ingest                    accept a SensorReading (real or simulated)
  WS   /live                      pushes a LiveUpdate on every new reading

Run:  uvicorn main:app --reload   (from the backend/ directory)
"""
from __future__ import annotations

import os

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import asyncio
import contextlib
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import store
from config import METAL_NAMES, METAL_RANGES, METALS, SIM_INTERVAL_SECONDS
from data.sites import BUOYS, CANDIDATE_SOURCES, LAKES, buoys_for_lake
from schemas import SensorReading
from utils import weather
from utils.simulator import next_reading

app = FastAPI(title="MetalDetect API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo only; restrict for production
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- WebSocket connection manager ------------------------------------------
class Hub:
    def __init__(self) -> None:
        self.clients: set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.clients.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self.clients.discard(ws)

    async def broadcast(self, payload: dict) -> None:
        dead = []
        for ws in list(self.clients):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


hub = Hub()


# --- background simulator loop ---------------------------------------------
async def _sim_loop() -> None:
    while True:
        for buoy_id in BUOYS:
            reading = next_reading(buoy_id)
            update = store.ingest(reading)
            await hub.broadcast(update.model_dump(mode="json"))
        await asyncio.sleep(SIM_INTERVAL_SECONDS)


@app.on_event("startup")
async def _startup() -> None:
    store.seed()
    app.state.sim_task = asyncio.create_task(_sim_loop())


@app.on_event("shutdown")
async def _shutdown() -> None:
    task = getattr(app.state, "sim_task", None)
    if task:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


# --- REST -------------------------------------------------------------------
@app.get("/health")
def health() -> dict:
    return {"status": "ok", "metals": METALS, "buoys": list(BUOYS)}


@app.get("/metals")
def metals() -> dict:
    return {
        "metals": [
            {"symbol": m, "name": METAL_NAMES[m], **METAL_RANGES[m]} for m in METALS
        ]
    }


@app.get("/weather")
def weather_all() -> dict:
    """Live weather per lake from Open-Meteo (falls back to seasonal averages)."""
    return {"live": weather.is_live(), "weather": weather.all_weather()}


@app.get("/lakes")
def lakes() -> list[dict]:
    out = []
    for lake in LAKES.values():
        buoys = buoys_for_lake(lake["id"])
        for b in buoys:
            b["status"] = store.status_of(b["id"])
        out.append({**lake, "buoys": buoys, "weather": weather.get(lake["id"])})
    return out


@app.get("/lakes/{lake_id}")
def lake(lake_id: str) -> dict:
    if lake_id not in LAKES:
        raise HTTPException(404, "lake not found")
    buoys = buoys_for_lake(lake_id)
    for b in buoys:
        b["status"] = store.status_of(b["id"])
    return {
        **LAKES[lake_id],
        "buoys": buoys,
        "weather": weather.get(lake_id),
        "candidate_sources": CANDIDATE_SOURCES.get(lake_id, []),
    }


@app.get("/buoys/{buoy_id}/latest")
def buoy_latest(buoy_id: str) -> dict:
    if buoy_id not in BUOYS:
        raise HTTPException(404, "buoy not found")
    update = store.latest_update(buoy_id)
    if update is None:
        raise HTTPException(503, "no readings yet")
    return update.model_dump(mode="json")


@app.get("/buoys/{buoy_id}/history")
def buoy_history(buoy_id: str, limit: int = 200) -> dict:
    if buoy_id not in BUOYS:
        raise HTTPException(404, "buoy not found")
    return {"buoy_id": buoy_id, "series": store.history_for(buoy_id, limit)}


@app.get("/attribution")
def attribution_all() -> list[dict]:
    return [a.model_dump(mode="json") for a in store.all_attributions()]


@app.get("/attribution/{buoy_id}")
def attribution_one(buoy_id: str) -> dict:
    result = store.attribution_for(buoy_id)
    if result is None:
        return {"buoy_id": buoy_id, "status": "clear", "ranked_candidates": []}
    return result.model_dump(mode="json")


@app.post("/ingest")
def ingest(reading: SensorReading) -> dict:
    if reading.timestamp is None:
        reading.timestamp = datetime.now(timezone.utc)
    return store.ingest(reading).model_dump(mode="json")


# --- WebSocket --------------------------------------------------------------
@app.websocket("/live")
async def live(ws: WebSocket) -> None:
    await hub.connect(ws)
    # Send a snapshot of the latest state for every buoy on connect.
    for buoy_id in BUOYS:
        update = store.latest_update(buoy_id)
        if update is not None:
            await ws.send_json(update.model_dump(mode="json"))
    try:
        while True:
            await ws.receive_text()  # keep the socket open; ignore inbound
    except WebSocketDisconnect:
        hub.disconnect(ws)
    except Exception:
        hub.disconnect(ws)
