"""Static context data for the demo — stands in for Google Maps + weather APIs.

Everything here is intentionally offline so the demo carries zero external-API
risk (PRD 10, 11). Pilot sites (PRD 9). All industrial candidate
markers are FICTIONAL, illustrative placeholders representing publicly
documented *industry categories* known to operate near these rivers — no real,
named company is identified or accused (PRD 9.3).
"""
from __future__ import annotations

# --- Lakes / rivers ---------------------------------------------------------
LAKES: dict[str, dict] = {
    "adyar": {
        "id": "adyar",
        "name": "Adyar River",
        "city_region": "Chennai (Guindy / IIT Madras)",
        "lat": 13.0067,
        "lng": 80.2206,
        "description": (
            "Long-monitored urban river running past the IIT Madras campus and "
            "Guindy. Chennai flagship node."
        ),
    },
    "noyyal": {
        "id": "noyyal",
        "name": "Noyyal River",
        "city_region": "Coimbatore / Tirupur",
        "lat": 11.0168,
        "lng": 77.0,
        "description": (
            "Extensively studied heavy-metal-impacted river; documented Pb, Cr, "
            "Ni, Cu, Cd, Zn linked to the Tirupur textile dyeing cluster. "
            "Coimbatore flagship node."
        ),
    },
    "cooum": {
        "id": "cooum",
        "name": "Cooum River",
        "city_region": "Chennai (Central / Egmore)",
        "lat": 13.0827,
        "lng": 80.2562,
        "description": (
            "Heavily urbanised Chennai river traversing the city centre. "
            "Receives mixed industrial and domestic discharge."
        ),
    },
    "vaigai": {
        "id": "vaigai",
        "name": "Vaigai River",
        "city_region": "Madurai",
        "lat": 9.9252,
        "lng": 78.1198,
        "description": (
            "Major river through Madurai, impacted by garment dyeing and "
            "paper-mill effluents from peri-urban industrial estates."
        ),
    },
    "palar": {
        "id": "palar",
        "name": "Palar River",
        "city_region": "Vellore / Ranipet",
        "lat": 12.9165,
        "lng": 79.1325,
        "description": (
            "Documented hotspot for chromium and lead contamination from "
            "the Vellore–Ranipet tannery belt."
        ),
    },
}

# --- Buoys (one per site for the demo) --------------------------------------
BUOYS: dict[str, dict] = {
    "adyar-01": {
        "id": "adyar-01",
        "lake_id": "adyar",
        "lat": 13.0072,
        "lng": 80.2215,
        "deployment_date": "2026-07-03",
        "status": "normal",
    },
    "noyyal-01": {
        "id": "noyyal-01",
        "lake_id": "noyyal",
        "lat": 11.0175,
        "lng": 77.0021,
        "deployment_date": "2026-06-28",
        "status": "normal",
    },
    "cooum-01": {
        "id": "cooum-01",
        "lake_id": "cooum",
        "lat": 13.0830,
        "lng": 80.2570,
        "deployment_date": "2026-07-10",
        "status": "normal",
    },
    "vaigai-01": {
        "id": "vaigai-01",
        "lake_id": "vaigai",
        "lat": 9.9255,
        "lng": 78.1205,
        "deployment_date": "2026-07-15",
        "status": "normal",
    },
    "palar-01": {
        "id": "palar-01",
        "lake_id": "palar",
        "lat": 12.9170,
        "lng": 79.1330,
        "deployment_date": "2026-07-20",
        "status": "normal",
    },
}

# --- Historical setpoints (baseline per lake per metal, ug/L) ---------------
# Used for the deviation / Increase calculation in the attribution layer.
SETPOINTS: dict[str, dict[str, float]] = {
    "adyar":  {"Pb": 4.0,  "Cr": 6.0,  "Ni": 5.0, "Cu": 9.0,  "Cd": 0.8, "Zn": 18.0},
    "noyyal": {"Pb": 6.0,  "Cr": 10.0, "Ni": 7.0, "Cu": 12.0, "Cd": 1.2, "Zn": 25.0},
    "cooum":  {"Pb": 5.0,  "Cr": 7.0,  "Ni": 5.5, "Cu": 10.0, "Cd": 1.0, "Zn": 20.0},
    "vaigai": {"Pb": 5.5,  "Cr": 8.0,  "Ni": 6.0, "Cu": 11.0, "Cd": 1.1, "Zn": 22.0},
    "palar":  {"Pb": 7.0,  "Cr": 15.0, "Ni": 8.0, "Cu": 13.0, "Cd": 1.5, "Zn": 28.0},
}

# --- Fictional candidate sources (PRD 9.3) ----------------------------------
# `metal_fingerprint` follows the industry->metal mapping in PRD 5.6.
# Non-industrial categories are ALWAYS present (never omitted) per PRD 5.6.
CANDIDATE_SOURCES: dict[str, list[dict]] = {
    "noyyal": [
        {
            "id": "noy-tex-1", "name": "Illustrative Textile Dyeing Unit A",
            "type": "industrial", "lat": 11.0201, "lng": 77.0065,
            "metal_fingerprint": ["Cr", "Cu"],
            "note": "Fictional — represents Tirupur dyeing/bleaching category",
        },
        {
            "id": "noy-plate-1", "name": "Illustrative Electroplating Workshop B",
            "type": "industrial", "lat": 11.0142, "lng": 76.9958,
            "metal_fingerprint": ["Cr", "Cd", "Ni"],
            "note": "Fictional — represents electroplating category",
        },
        {
            "id": "noy-agri-1", "name": "Agricultural Runoff (upstream fields)",
            "type": "agricultural", "lat": 11.0250, "lng": 77.0120,
            "metal_fingerprint": ["Cu", "Zn"],
            "note": "Fertiliser / pesticide runoff",
        },
        {
            "id": "noy-sew-1", "name": "Urban / Sewage Outfall",
            "type": "sewage", "lat": 11.0110, "lng": 76.9900,
            "metal_fingerprint": ["Pb", "Zn", "Cu"],
            "note": "Untreated urban discharge",
        },
        {
            "id": "noy-nat-1", "name": "Natural Geological Background",
            "type": "natural", "lat": 11.0080, "lng": 77.0050,
            "metal_fingerprint": ["Ni", "Cr"],
            "note": "Weathering of local mineral deposits",
        },
    ],
    "adyar": [
        {
            "id": "ady-plate-1", "name": "Illustrative Metal Finishing Unit C",
            "type": "industrial", "lat": 13.0091, "lng": 80.2240,
            "metal_fingerprint": ["Cr", "Ni", "Cd"],
            "note": "Fictional — represents metal-finishing category",
        },
        {
            "id": "ady-batt-1", "name": "Illustrative Battery Workshop D",
            "type": "industrial", "lat": 13.0040, "lng": 80.2170,
            "metal_fingerprint": ["Pb", "Cd"],
            "note": "Fictional — represents battery manufacturing category",
        },
        {
            "id": "ady-sew-1", "name": "Urban / Sewage Outfall",
            "type": "sewage", "lat": 13.0055, "lng": 80.2250,
            "metal_fingerprint": ["Pb", "Zn", "Cu"],
            "note": "Untreated urban discharge",
        },
        {
            "id": "ady-agri-1", "name": "Agricultural Runoff",
            "type": "agricultural", "lat": 13.0100, "lng": 80.2150,
            "metal_fingerprint": ["Cu", "Zn"],
            "note": "Fertiliser / pesticide runoff",
        },
        {
            "id": "ady-nat-1", "name": "Natural Geological Background",
            "type": "natural", "lat": 13.0030, "lng": 80.2200,
            "metal_fingerprint": ["Ni", "Cr"],
            "note": "Weathering of local mineral deposits",
        },
    ],
    "cooum": [
        {
            "id": "coo-tan-1", "name": "Illustrative Tannery Unit E",
            "type": "industrial", "lat": 13.0840, "lng": 80.2580,
            "metal_fingerprint": ["Cr", "Pb", "Zn"],
            "note": "Fictional — represents tannery/leather category",
        },
        {
            "id": "coo-paint-1", "name": "Illustrative Paint Manufacturing F",
            "type": "industrial", "lat": 13.0815, "lng": 80.2545,
            "metal_fingerprint": ["Pb", "Cd"],
            "note": "Fictional — represents paint/coating category",
        },
        {
            "id": "coo-agri-1", "name": "Agricultural Runoff",
            "type": "agricultural", "lat": 13.0850, "lng": 80.2600,
            "metal_fingerprint": ["Cu", "Zn"],
            "note": "Fertiliser / pesticide runoff",
        },
        {
            "id": "coo-sew-1", "name": "Urban / Sewage Outfall",
            "type": "sewage", "lat": 13.0800, "lng": 80.2530,
            "metal_fingerprint": ["Pb", "Zn", "Cu"],
            "note": "Untreated urban discharge",
        },
        {
            "id": "coo-nat-1", "name": "Natural Geological Background",
            "type": "natural", "lat": 13.0810, "lng": 80.2555,
            "metal_fingerprint": ["Ni", "Cr"],
            "note": "Weathering of local mineral deposits",
        },
    ],
    "vaigai": [
        {
            "id": "vai-dye-1", "name": "Illustrative Garment Dyeing Unit G",
            "type": "industrial", "lat": 9.9265, "lng": 78.1215,
            "metal_fingerprint": ["Cr", "Cu"],
            "note": "Fictional — represents garment dyeing category",
        },
        {
            "id": "vai-paper-1", "name": "Illustrative Paper Mill H",
            "type": "industrial", "lat": 9.9240, "lng": 78.1185,
            "metal_fingerprint": ["Pb", "Zn"],
            "note": "Fictional — represents paper/pulp manufacturing category",
        },
        {
            "id": "vai-agri-1", "name": "Agricultural Runoff",
            "type": "agricultural", "lat": 9.9275, "lng": 78.1230,
            "metal_fingerprint": ["Cu", "Zn"],
            "note": "Fertiliser / pesticide runoff",
        },
        {
            "id": "vai-sew-1", "name": "Urban / Sewage Outfall",
            "type": "sewage", "lat": 9.9235, "lng": 78.1175,
            "metal_fingerprint": ["Pb", "Zn", "Cu"],
            "note": "Untreated urban discharge",
        },
        {
            "id": "vai-nat-1", "name": "Natural Geological Background",
            "type": "natural", "lat": 9.9245, "lng": 78.1195,
            "metal_fingerprint": ["Ni", "Cr"],
            "note": "Weathering of local mineral deposits",
        },
    ],
    "palar": [
        {
            "id": "pal-tan-1", "name": "Illustrative Tannery Cluster I",
            "type": "industrial", "lat": 12.9180, "lng": 79.1345,
            "metal_fingerprint": ["Cr", "Pb", "Cd"],
            "note": "Fictional — represents Vellore/Ranipet tannery belt category",
        },
        {
            "id": "pal-leath-1", "name": "Illustrative Leather Chemical Plant J",
            "type": "industrial", "lat": 12.9155, "lng": 79.1310,
            "metal_fingerprint": ["Cr", "Ni"],
            "note": "Fictional — represents leather chemical processing category",
        },
        {
            "id": "pal-agri-1", "name": "Agricultural Runoff",
            "type": "agricultural", "lat": 12.9190, "lng": 79.1355,
            "metal_fingerprint": ["Cu", "Zn"],
            "note": "Fertiliser / pesticide runoff",
        },
        {
            "id": "pal-sew-1", "name": "Urban / Sewage Outfall",
            "type": "sewage", "lat": 12.9145, "lng": 79.1300,
            "metal_fingerprint": ["Pb", "Zn", "Cu"],
            "note": "Untreated urban discharge",
        },
        {
            "id": "pal-nat-1", "name": "Natural Geological Background",
            "type": "natural", "lat": 12.9160, "lng": 79.1320,
            "metal_fingerprint": ["Ni", "Cr"],
            "note": "Weathering of local mineral deposits",
        },
    ],
}

# --- Mock weather per site (stands in for OpenWeatherMap) -------------------
WEATHER: dict[str, dict] = {
    "adyar":  {"ambient_temp": 31.5, "rainfall_24h": 2.0},
    "noyyal": {"ambient_temp": 33.0, "rainfall_24h": 12.0},
    "cooum":  {"ambient_temp": 32.0, "rainfall_24h": 4.0},
    "vaigai": {"ambient_temp": 34.0, "rainfall_24h": 1.5},
    "palar":  {"ambient_temp": 31.0, "rainfall_24h": 6.0},
}


def buoys_for_lake(lake_id: str) -> list[dict]:
    return [b for b in BUOYS.values() if b["lake_id"] == lake_id]


# ---------------------------------------------------------------------------
# Additional sites across Tamil Nadu + neighbouring states, added to make the
# network fuller. Same fictional/illustrative candidate policy applies (PRD 9.3).
# ---------------------------------------------------------------------------
LAKES.update({
    "bhavani": {"id": "bhavani", "name": "Bhavani River", "city_region": "Erode",
                "lat": 11.4470, "lng": 77.6820,
                "description": "Textile bleaching/dyeing belt around Erode; documented dye-effluent metals."},
    "amaravathi": {"id": "amaravathi", "name": "Amaravathi River", "city_region": "Karur",
                   "lat": 10.9550, "lng": 78.0800,
                   "description": "Karur home-textile cluster; bleaching and dyeing discharge."},
    "cauvery": {"id": "cauvery", "name": "Cauvery River", "city_region": "Tiruchirappalli",
                "lat": 10.8300, "lng": 78.6900,
                "description": "Major basin river past Trichy; mixed urban and industrial inflow."},
    "periyar": {"id": "periyar", "name": "Periyar River", "city_region": "Kochi (Eloor–Edayar), Kerala",
                "lat": 10.0730, "lng": 76.3050,
                "description": "Eloor–Edayar industrial belt, Kerala — long-documented heavy-metal hotspot."},
    "vrishabhavathi": {"id": "vrishabhavathi", "name": "Vrishabhavathi River", "city_region": "Bengaluru, Karnataka",
                       "lat": 12.9100, "lng": 77.5200,
                       "description": "Bengaluru industrial + sewage-fed river with reported heavy metals."},
    "musi": {"id": "musi", "name": "Musi River", "city_region": "Hyderabad, Telangana",
             "lat": 17.3600, "lng": 78.4900,
             "description": "Hyderabad river carrying pharma and industrial effluent downstream."},
})

BUOYS.update({
    "bhavani-01": {"id": "bhavani-01", "lake_id": "bhavani", "lat": 11.4475, "lng": 77.6828, "deployment_date": "2026-07-25", "status": "normal"},
    "amaravathi-01": {"id": "amaravathi-01", "lake_id": "amaravathi", "lat": 10.9556, "lng": 78.0808, "deployment_date": "2026-07-27", "status": "normal"},
    "cauvery-01": {"id": "cauvery-01", "lake_id": "cauvery", "lat": 10.8306, "lng": 78.6908, "deployment_date": "2026-07-29", "status": "normal"},
    "periyar-01": {"id": "periyar-01", "lake_id": "periyar", "lat": 10.0736, "lng": 76.3058, "deployment_date": "2026-08-01", "status": "normal"},
    "vrishabhavathi-01": {"id": "vrishabhavathi-01", "lake_id": "vrishabhavathi", "lat": 12.9106, "lng": 77.5208, "deployment_date": "2026-08-03", "status": "normal"},
    "musi-01": {"id": "musi-01", "lake_id": "musi", "lat": 17.3606, "lng": 78.4908, "deployment_date": "2026-08-05", "status": "normal"},
})

SETPOINTS.update({
    "bhavani":        {"Pb": 5.0, "Cr": 11.0, "Ni": 6.0, "Cu": 11.0, "Cd": 1.1, "Zn": 23.0},
    "amaravathi":     {"Pb": 5.5, "Cr": 12.0, "Ni": 6.5, "Cu": 12.0, "Cd": 1.2, "Zn": 24.0},
    "cauvery":        {"Pb": 4.0, "Cr": 6.0,  "Ni": 5.0, "Cu": 9.0,  "Cd": 0.8, "Zn": 17.0},
    "periyar":        {"Pb": 8.0, "Cr": 14.0, "Ni": 9.0, "Cu": 15.0, "Cd": 1.8, "Zn": 30.0},
    "vrishabhavathi": {"Pb": 7.0, "Cr": 12.0, "Ni": 8.0, "Cu": 14.0, "Cd": 1.5, "Zn": 27.0},
    "musi":           {"Pb": 6.5, "Cr": 11.0, "Ni": 7.5, "Cu": 13.0, "Cd": 1.4, "Zn": 26.0},
})

WEATHER.update({
    "bhavani":        {"ambient_temp": 32.5, "rainfall_24h": 3.0},
    "amaravathi":     {"ambient_temp": 33.5, "rainfall_24h": 2.0},
    "cauvery":        {"ambient_temp": 32.0, "rainfall_24h": 5.0},
    "periyar":        {"ambient_temp": 30.0, "rainfall_24h": 14.0},
    "vrishabhavathi": {"ambient_temp": 28.0, "rainfall_24h": 8.0},
    "musi":           {"ambient_temp": 33.0, "rainfall_24h": 4.0},
})


def _std_sources(prefix: str, ind_name: str, ind_fp: list[str], lat: float, lng: float) -> list[dict]:
    """Compact per-lake candidate set: one illustrative industrial category plus
    the always-present agricultural / sewage / natural categories (PRD 5.6)."""
    return [
        {"id": f"{prefix}-ind-1", "name": ind_name, "type": "industrial",
         "lat": lat + 0.002, "lng": lng + 0.002, "metal_fingerprint": ind_fp,
         "note": "Fictional — illustrative industry category for this basin"},
        {"id": f"{prefix}-agri-1", "name": "Agricultural Runoff", "type": "agricultural",
         "lat": lat + 0.003, "lng": lng - 0.001, "metal_fingerprint": ["Cu", "Zn"],
         "note": "Fertiliser / pesticide runoff"},
        {"id": f"{prefix}-sew-1", "name": "Urban / Sewage Outfall", "type": "sewage",
         "lat": lat - 0.002, "lng": lng + 0.001, "metal_fingerprint": ["Pb", "Zn", "Cu"],
         "note": "Untreated urban discharge"},
        {"id": f"{prefix}-nat-1", "name": "Natural Geological Background", "type": "natural",
         "lat": lat - 0.001, "lng": lng - 0.002, "metal_fingerprint": ["Ni", "Cr"],
         "note": "Weathering of local mineral deposits"},
    ]


CANDIDATE_SOURCES.update({
    "bhavani": _std_sources("bha", "Illustrative Dyeing/Bleaching Unit K", ["Cr", "Cu"], 11.4470, 77.6820),
    "amaravathi": _std_sources("ama", "Illustrative Home-Textile Dyeing Unit L", ["Cr", "Cu", "Zn"], 10.9550, 78.0800),
    "cauvery": _std_sources("cau", "Illustrative Sugar/Distillery Unit M", ["Pb", "Zn"], 10.8300, 78.6900),
    "periyar": _std_sources("per", "Illustrative Chemical/Fertiliser Plant N", ["Cd", "Ni", "Cr"], 10.0730, 76.3050),
    "vrishabhavathi": _std_sources("vri", "Illustrative Electroplating Cluster O", ["Cr", "Ni", "Cd"], 12.9100, 77.5200),
    "musi": _std_sources("mus", "Illustrative Pharma/Bulk-Drug Unit P", ["Pb", "Cd", "Cr"], 17.3600, 78.4900),
})
