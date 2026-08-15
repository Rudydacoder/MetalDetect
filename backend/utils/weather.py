"""Live weather via Open-Meteo (https://open-meteo.com).

Open-Meteo is a free, open-source weather API built on open government data
(DWD, NOAA, ECMWF...). It needs **no API key**, which keeps the deployment
key-free and the demo offline-safe.

Weather feeds two things in MetalDetect:
  * `ambient_temp`    - shown alongside water temperature per lake
  * `rainfall_24h`    - the Trends rainfall overlay, and the narrative link
                        between storms and runoff-driven contamination spikes

Design notes:
  * One batched request covers every lake (Open-Meteo accepts comma-separated
    coordinate lists), so we make a single call rather than 11.
  * Results are cached for CACHE_TTL_SECONDS; the network call never blocks a
    request path for more than HTTP_TIMEOUT seconds.
  * If the API is unreachable (offline demo, rate limit, DNS down) we fall back
    to the static seasonal averages in `data.sites.WEATHER`, so the app keeps
    working exactly as before. Failure is logged, never raised.
"""
from __future__ import annotations

import json
import logging
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

from data.sites import LAKES, WEATHER as FALLBACK_WEATHER

log = logging.getLogger("metaldetect.weather")

API_URL = "https://api.open-meteo.com/v1/forecast"
HTTP_TIMEOUT = 6.0          # seconds; keep short so we degrade fast
CACHE_TTL_SECONDS = 15 * 60  # weather changes slowly; 15 min is plenty

_lock = threading.Lock()
_cache: dict[str, dict] = {}
_cache_at: float = 0.0
_live: bool = False  # whether the last refresh actually reached Open-Meteo


def _fetch_open_meteo() -> dict[str, dict] | None:
    """One batched call for every lake. Returns None on any failure."""
    lake_ids = list(LAKES.keys())
    if not lake_ids:
        return None

    params = {
        "latitude": ",".join(str(LAKES[i]["lat"]) for i in lake_ids),
        "longitude": ",".join(str(LAKES[i]["lng"]) for i in lake_ids),
        "current": "temperature_2m,precipitation",
        "daily": "precipitation_sum",
        "past_days": 1,
        "forecast_days": 1,
        "timezone": "UTC",
    }
    url = f"{API_URL}?{urllib.parse.urlencode(params)}"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MetalDetect/1.0"})
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, ValueError, OSError) as exc:
        log.warning("Open-Meteo unavailable (%s); using static fallback weather", exc)
        return None

    # A multi-coordinate request returns a list; a single one returns an object.
    entries = payload if isinstance(payload, list) else [payload]
    if len(entries) != len(lake_ids):
        log.warning("Open-Meteo returned %d entries for %d lakes", len(entries), len(lake_ids))
        return None

    out: dict[str, dict] = {}
    for lake_id, entry in zip(lake_ids, entries):
        try:
            temp = float(entry["current"]["temperature_2m"])
            # `past_days=1` puts yesterday first — that is the true trailing 24h.
            sums = entry.get("daily", {}).get("precipitation_sum") or [0.0]
            rain = float(sums[0] if sums[0] is not None else 0.0)
            out[lake_id] = {
                "ambient_temp": round(temp, 1),
                "rainfall_24h": round(rain, 1),
                "source": "open-meteo",
            }
        except (KeyError, TypeError, ValueError, IndexError):
            # One bad entry shouldn't sink the batch — fall back for this lake.
            out[lake_id] = {**FALLBACK_WEATHER.get(lake_id, {}), "source": "fallback"}
    return out


def _refresh_if_stale() -> None:
    global _cache, _cache_at, _live
    now = time.time()
    if _cache and (now - _cache_at) < CACHE_TTL_SECONDS:
        return
    fresh = _fetch_open_meteo()
    with _lock:
        if fresh:
            _cache = fresh
            _live = True
        else:
            _cache = {
                lid: {**vals, "source": "fallback"}
                for lid, vals in FALLBACK_WEATHER.items()
            }
            _live = False
        _cache_at = now


def get(lake_id: str) -> dict:
    """Weather for one lake — live if reachable, static fallback otherwise."""
    _refresh_if_stale()
    return _cache.get(lake_id) or {
        **FALLBACK_WEATHER.get(lake_id, {"ambient_temp": 30.0, "rainfall_24h": 0.0}),
        "source": "fallback",
    }


def all_weather() -> dict[str, dict]:
    _refresh_if_stale()
    return dict(_cache)


def is_live() -> bool:
    """True when the last refresh actually came from Open-Meteo."""
    _refresh_if_stale()
    return _live
