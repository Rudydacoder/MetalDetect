"""Rule-based source attribution (PRD 5.6).

Deliberately NOT a black box: output carries reputational weight, so this is a
transparent, explainable scorer grounded in real source-apportionment logic.

Scoring per candidate:
  * deviation match  - does the candidate's metal fingerprint overlap the metals
                       that actually exceeded their setpoint, weighted by how far
                       above setpoint each metal is?
  * spatial proximity - candidates physically closer to the buoy score higher.
Scores are normalized across the list; the result is a ranked, confidence-scored
set of candidates (never a single named accusation).
"""
from __future__ import annotations

import math
from datetime import datetime

from config import METALS, status_for
from data.sites import BUOYS, CANDIDATE_SOURCES, SETPOINTS
from schemas import AttributionResult, Candidate, ConcentrationEstimate


def _haversine_km(a_lat, a_lng, b_lat, b_lng) -> float:
    r = 6371.0
    dlat = math.radians(b_lat - a_lat)
    dlng = math.radians(b_lng - a_lng)
    x = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(a_lat))
        * math.cos(math.radians(b_lat))
        * math.sin(dlng / 2) ** 2
    )
    return r * 2 * math.asin(math.sqrt(x))


def attribute(
    buoy_id: str,
    lake_id: str,
    estimates: list[ConcentrationEstimate],
    timestamp: datetime,
) -> AttributionResult | None:
    setpoints = SETPOINTS.get(lake_id, {})

    # Deviation / Increase per metal above its historical setpoint.
    increase: dict[str, float] = {}
    triggered: list[str] = []
    for est in estimates:
        base = setpoints.get(est.metal, 0.0)
        inc = est.estimated_concentration - base
        increase[est.metal] = inc
        if est.status == "alert":
            triggered.append(est.metal)

    if not triggered:
        return AttributionResult(
            buoy_id=buoy_id,
            lake_id=lake_id,
            timestamp=timestamp,
            triggered_metals=[],
            ranked_candidates=[],
            status="clear",
        )

    buoy = BUOYS[buoy_id]
    candidates = CANDIDATE_SOURCES.get(lake_id, [])

    raw: list[tuple[dict, float, list[str]]] = []
    for c in candidates:
        # Fingerprint match weighted by how far each matched metal is above set.
        matched = [m for m in c["metal_fingerprint"] if m in triggered]
        fp_score = sum(max(0.0, increase.get(m, 0.0)) for m in matched)

        # Spatial proximity (closer -> higher). ~2 km decay scale.
        dist = _haversine_km(buoy["lat"], buoy["lng"], c["lat"], c["lng"])
        proximity = math.exp(-dist / 2.0)

        # Non-industrial baseline candidates always retain a small floor score
        # so they are never dropped from the list (PRD 5.6).
        floor = 0.05 if c["type"] != "industrial" else 0.0
        score = fp_score * (0.5 + 0.5 * proximity) + floor
        raw.append((c, score, matched))

    total = sum(s for _, s, _ in raw) or 1.0
    ranked = sorted(raw, key=lambda t: t[1], reverse=True)

    ranked_candidates = [
        Candidate(
            id=c["id"],
            name=c["name"],
            type=c["type"],
            lat=c["lat"],
            lng=c["lng"],
            confidence=round(score / total, 3),
            matched_metals=matched,
            note=c.get("note", ""),
        )
        for c, score, matched in ranked
    ]

    return AttributionResult(
        buoy_id=buoy_id,
        lake_id=lake_id,
        timestamp=timestamp,
        triggered_metals=triggered,
        ranked_candidates=ranked_candidates,
        status="flagged",
    )
