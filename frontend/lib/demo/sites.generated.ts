// AUTO-GENERATED from the Python backend — do not edit by hand.
// Regenerate with: scripts/gen-demo-data.py (see README).
//
// This mirrors backend/data/sites.py + backend/config.py so the built-in demo
// data layer (used when no FastAPI backend is configured) produces exactly the
// same lakes, buoys, thresholds and candidate sources as the real backend.

export const METALS: string[] = [
  "Pb",
  "Cr",
  "Ni",
  "Cu",
  "Cd",
  "Zn"
];

export const METAL_NAMES: Record<string, string> = {
  "Pb": "Lead",
  "Cr": "Chromium",
  "Ni": "Nickel",
  "Cu": "Copper",
  "Cd": "Cadmium",
  "Zn": "Zinc"
};

export interface MetalRange {
  baseline: number;
  elevated: number;
  alert: number;
  max: number;
}

export const METAL_RANGES: Record<string, MetalRange> = {
  "Pb": {
    "baseline": 5.0,
    "elevated": 15.0,
    "alert": 30.0,
    "max": 120.0
  },
  "Cr": {
    "baseline": 8.0,
    "elevated": 25.0,
    "alert": 50.0,
    "max": 200.0
  },
  "Ni": {
    "baseline": 6.0,
    "elevated": 20.0,
    "alert": 40.0,
    "max": 150.0
  },
  "Cu": {
    "baseline": 10.0,
    "elevated": 30.0,
    "alert": 60.0,
    "max": 180.0
  },
  "Cd": {
    "baseline": 1.0,
    "elevated": 3.0,
    "alert": 6.0,
    "max": 25.0
  },
  "Zn": {
    "baseline": 20.0,
    "elevated": 60.0,
    "alert": 120.0,
    "max": 400.0
  }
};

/** Langmuir sensor-response curve per metal (SWV current from concentration). */
export const LANGMUIR: Record<string, { i_max: number; kd: number; base: number }> =
{
  "Pb": {
    "i_max": 3.2,
    "kd": 40.0,
    "base": 0.15
  },
  "Cr": {
    "i_max": 2.8,
    "kd": 55.0,
    "base": 0.12
  },
  "Ni": {
    "i_max": 2.5,
    "kd": 45.0,
    "base": 0.1
  },
  "Cu": {
    "i_max": 3.0,
    "kd": 50.0,
    "base": 0.14
  },
  "Cd": {
    "i_max": 3.6,
    "kd": 8.0,
    "base": 0.18
  },
  "Zn": {
    "i_max": 2.2,
    "kd": 90.0,
    "base": 0.09
  }
};

export const LAKES: Record<string, {
  id: string;
  name: string;
  city_region: string;
  lat: number;
  lng: number;
  description: string;
}> = {
  "adyar": {
    "id": "adyar",
    "name": "Adyar River",
    "city_region": "Chennai (Guindy / IIT Madras)",
    "lat": 13.0067,
    "lng": 80.2206,
    "description": "Long-monitored urban river running past the IIT Madras campus and Guindy. Chennai flagship node."
  },
  "noyyal": {
    "id": "noyyal",
    "name": "Noyyal River",
    "city_region": "Coimbatore / Tirupur",
    "lat": 11.0168,
    "lng": 77.0,
    "description": "Extensively studied heavy-metal-impacted river; documented Pb, Cr, Ni, Cu, Cd, Zn linked to the Tirupur textile dyeing cluster. Coimbatore flagship node."
  },
  "cooum": {
    "id": "cooum",
    "name": "Cooum River",
    "city_region": "Chennai (Central / Egmore)",
    "lat": 13.0827,
    "lng": 80.2562,
    "description": "Heavily urbanised Chennai river traversing the city centre. Receives mixed industrial and domestic discharge."
  },
  "vaigai": {
    "id": "vaigai",
    "name": "Vaigai River",
    "city_region": "Madurai",
    "lat": 9.9252,
    "lng": 78.1198,
    "description": "Major river through Madurai, impacted by garment dyeing and paper-mill effluents from peri-urban industrial estates."
  },
  "palar": {
    "id": "palar",
    "name": "Palar River",
    "city_region": "Vellore / Ranipet",
    "lat": 12.9165,
    "lng": 79.1325,
    "description": "Documented hotspot for chromium and lead contamination from the Vellore–Ranipet tannery belt."
  },
  "bhavani": {
    "id": "bhavani",
    "name": "Bhavani River",
    "city_region": "Erode",
    "lat": 11.447,
    "lng": 77.682,
    "description": "Textile bleaching/dyeing belt around Erode; documented dye-effluent metals."
  },
  "amaravathi": {
    "id": "amaravathi",
    "name": "Amaravathi River",
    "city_region": "Karur",
    "lat": 10.955,
    "lng": 78.08,
    "description": "Karur home-textile cluster; bleaching and dyeing discharge."
  },
  "cauvery": {
    "id": "cauvery",
    "name": "Cauvery River",
    "city_region": "Tiruchirappalli",
    "lat": 10.83,
    "lng": 78.69,
    "description": "Major basin river past Trichy; mixed urban and industrial inflow."
  },
  "periyar": {
    "id": "periyar",
    "name": "Periyar River",
    "city_region": "Kochi (Eloor–Edayar), Kerala",
    "lat": 10.073,
    "lng": 76.305,
    "description": "Eloor–Edayar industrial belt, Kerala — long-documented heavy-metal hotspot."
  },
  "vrishabhavathi": {
    "id": "vrishabhavathi",
    "name": "Vrishabhavathi River",
    "city_region": "Bengaluru, Karnataka",
    "lat": 12.91,
    "lng": 77.52,
    "description": "Bengaluru industrial + sewage-fed river with reported heavy metals."
  },
  "musi": {
    "id": "musi",
    "name": "Musi River",
    "city_region": "Hyderabad, Telangana",
    "lat": 17.36,
    "lng": 78.49,
    "description": "Hyderabad river carrying pharma and industrial effluent downstream."
  }
};

export const BUOYS: Record<string, {
  id: string;
  lake_id: string;
  lat: number;
  lng: number;
  deployment_date: string;
  status: string;
}> = {
  "adyar-01": {
    "id": "adyar-01",
    "lake_id": "adyar",
    "lat": 13.0072,
    "lng": 80.2215,
    "deployment_date": "2026-07-03",
    "status": "normal"
  },
  "noyyal-01": {
    "id": "noyyal-01",
    "lake_id": "noyyal",
    "lat": 11.0175,
    "lng": 77.0021,
    "deployment_date": "2026-06-28",
    "status": "normal"
  },
  "cooum-01": {
    "id": "cooum-01",
    "lake_id": "cooum",
    "lat": 13.083,
    "lng": 80.257,
    "deployment_date": "2026-07-10",
    "status": "normal"
  },
  "vaigai-01": {
    "id": "vaigai-01",
    "lake_id": "vaigai",
    "lat": 9.9255,
    "lng": 78.1205,
    "deployment_date": "2026-07-15",
    "status": "normal"
  },
  "palar-01": {
    "id": "palar-01",
    "lake_id": "palar",
    "lat": 12.917,
    "lng": 79.133,
    "deployment_date": "2026-07-20",
    "status": "normal"
  },
  "bhavani-01": {
    "id": "bhavani-01",
    "lake_id": "bhavani",
    "lat": 11.4475,
    "lng": 77.6828,
    "deployment_date": "2026-07-25",
    "status": "normal"
  },
  "amaravathi-01": {
    "id": "amaravathi-01",
    "lake_id": "amaravathi",
    "lat": 10.9556,
    "lng": 78.0808,
    "deployment_date": "2026-07-27",
    "status": "normal"
  },
  "cauvery-01": {
    "id": "cauvery-01",
    "lake_id": "cauvery",
    "lat": 10.8306,
    "lng": 78.6908,
    "deployment_date": "2026-07-29",
    "status": "normal"
  },
  "periyar-01": {
    "id": "periyar-01",
    "lake_id": "periyar",
    "lat": 10.0736,
    "lng": 76.3058,
    "deployment_date": "2026-08-01",
    "status": "normal"
  },
  "vrishabhavathi-01": {
    "id": "vrishabhavathi-01",
    "lake_id": "vrishabhavathi",
    "lat": 12.9106,
    "lng": 77.5208,
    "deployment_date": "2026-08-03",
    "status": "normal"
  },
  "musi-01": {
    "id": "musi-01",
    "lake_id": "musi",
    "lat": 17.3606,
    "lng": 78.4908,
    "deployment_date": "2026-08-05",
    "status": "normal"
  }
};

/** Historical per-lake baseline concentration used by attribution. */
export const SETPOINTS: Record<string, Record<string, number>> = {
  "adyar": {
    "Pb": 4.0,
    "Cr": 6.0,
    "Ni": 5.0,
    "Cu": 9.0,
    "Cd": 0.8,
    "Zn": 18.0
  },
  "noyyal": {
    "Pb": 6.0,
    "Cr": 10.0,
    "Ni": 7.0,
    "Cu": 12.0,
    "Cd": 1.2,
    "Zn": 25.0
  },
  "cooum": {
    "Pb": 5.0,
    "Cr": 7.0,
    "Ni": 5.5,
    "Cu": 10.0,
    "Cd": 1.0,
    "Zn": 20.0
  },
  "vaigai": {
    "Pb": 5.5,
    "Cr": 8.0,
    "Ni": 6.0,
    "Cu": 11.0,
    "Cd": 1.1,
    "Zn": 22.0
  },
  "palar": {
    "Pb": 7.0,
    "Cr": 15.0,
    "Ni": 8.0,
    "Cu": 13.0,
    "Cd": 1.5,
    "Zn": 28.0
  },
  "bhavani": {
    "Pb": 5.0,
    "Cr": 11.0,
    "Ni": 6.0,
    "Cu": 11.0,
    "Cd": 1.1,
    "Zn": 23.0
  },
  "amaravathi": {
    "Pb": 5.5,
    "Cr": 12.0,
    "Ni": 6.5,
    "Cu": 12.0,
    "Cd": 1.2,
    "Zn": 24.0
  },
  "cauvery": {
    "Pb": 4.0,
    "Cr": 6.0,
    "Ni": 5.0,
    "Cu": 9.0,
    "Cd": 0.8,
    "Zn": 17.0
  },
  "periyar": {
    "Pb": 8.0,
    "Cr": 14.0,
    "Ni": 9.0,
    "Cu": 15.0,
    "Cd": 1.8,
    "Zn": 30.0
  },
  "vrishabhavathi": {
    "Pb": 7.0,
    "Cr": 12.0,
    "Ni": 8.0,
    "Cu": 14.0,
    "Cd": 1.5,
    "Zn": 27.0
  },
  "musi": {
    "Pb": 6.5,
    "Cr": 11.0,
    "Ni": 7.5,
    "Cu": 13.0,
    "Cd": 1.4,
    "Zn": 26.0
  }
};

export const CANDIDATE_SOURCES: Record<string, {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  metal_fingerprint: string[];
  note: string;
}[]> = {
  "noyyal": [
    {
      "id": "noy-tex-1",
      "name": "Illustrative Textile Dyeing Unit A",
      "type": "industrial",
      "lat": 11.0201,
      "lng": 77.0065,
      "metal_fingerprint": [
        "Cr",
        "Cu"
      ],
      "note": "Fictional — represents Tirupur dyeing/bleaching category"
    },
    {
      "id": "noy-plate-1",
      "name": "Illustrative Electroplating Workshop B",
      "type": "industrial",
      "lat": 11.0142,
      "lng": 76.9958,
      "metal_fingerprint": [
        "Cr",
        "Cd",
        "Ni"
      ],
      "note": "Fictional — represents electroplating category"
    },
    {
      "id": "noy-agri-1",
      "name": "Agricultural Runoff (upstream fields)",
      "type": "agricultural",
      "lat": 11.025,
      "lng": 77.012,
      "metal_fingerprint": [
        "Cu",
        "Zn"
      ],
      "note": "Fertiliser / pesticide runoff"
    },
    {
      "id": "noy-sew-1",
      "name": "Urban / Sewage Outfall",
      "type": "sewage",
      "lat": 11.011,
      "lng": 76.99,
      "metal_fingerprint": [
        "Pb",
        "Zn",
        "Cu"
      ],
      "note": "Untreated urban discharge"
    },
    {
      "id": "noy-nat-1",
      "name": "Natural Geological Background",
      "type": "natural",
      "lat": 11.008,
      "lng": 77.005,
      "metal_fingerprint": [
        "Ni",
        "Cr"
      ],
      "note": "Weathering of local mineral deposits"
    }
  ],
  "adyar": [
    {
      "id": "ady-plate-1",
      "name": "Illustrative Metal Finishing Unit C",
      "type": "industrial",
      "lat": 13.0091,
      "lng": 80.224,
      "metal_fingerprint": [
        "Cr",
        "Ni",
        "Cd"
      ],
      "note": "Fictional — represents metal-finishing category"
    },
    {
      "id": "ady-batt-1",
      "name": "Illustrative Battery Workshop D",
      "type": "industrial",
      "lat": 13.004,
      "lng": 80.217,
      "metal_fingerprint": [
        "Pb",
        "Cd"
      ],
      "note": "Fictional — represents battery manufacturing category"
    },
    {
      "id": "ady-sew-1",
      "name": "Urban / Sewage Outfall",
      "type": "sewage",
      "lat": 13.0055,
      "lng": 80.225,
      "metal_fingerprint": [
        "Pb",
        "Zn",
        "Cu"
      ],
      "note": "Untreated urban discharge"
    },
    {
      "id": "ady-agri-1",
      "name": "Agricultural Runoff",
      "type": "agricultural",
      "lat": 13.01,
      "lng": 80.215,
      "metal_fingerprint": [
        "Cu",
        "Zn"
      ],
      "note": "Fertiliser / pesticide runoff"
    },
    {
      "id": "ady-nat-1",
      "name": "Natural Geological Background",
      "type": "natural",
      "lat": 13.003,
      "lng": 80.22,
      "metal_fingerprint": [
        "Ni",
        "Cr"
      ],
      "note": "Weathering of local mineral deposits"
    }
  ],
  "cooum": [
    {
      "id": "coo-tan-1",
      "name": "Illustrative Tannery Unit E",
      "type": "industrial",
      "lat": 13.084,
      "lng": 80.258,
      "metal_fingerprint": [
        "Cr",
        "Pb",
        "Zn"
      ],
      "note": "Fictional — represents tannery/leather category"
    },
    {
      "id": "coo-paint-1",
      "name": "Illustrative Paint Manufacturing F",
      "type": "industrial",
      "lat": 13.0815,
      "lng": 80.2545,
      "metal_fingerprint": [
        "Pb",
        "Cd"
      ],
      "note": "Fictional — represents paint/coating category"
    },
    {
      "id": "coo-agri-1",
      "name": "Agricultural Runoff",
      "type": "agricultural",
      "lat": 13.085,
      "lng": 80.26,
      "metal_fingerprint": [
        "Cu",
        "Zn"
      ],
      "note": "Fertiliser / pesticide runoff"
    },
    {
      "id": "coo-sew-1",
      "name": "Urban / Sewage Outfall",
      "type": "sewage",
      "lat": 13.08,
      "lng": 80.253,
      "metal_fingerprint": [
        "Pb",
        "Zn",
        "Cu"
      ],
      "note": "Untreated urban discharge"
    },
    {
      "id": "coo-nat-1",
      "name": "Natural Geological Background",
      "type": "natural",
      "lat": 13.081,
      "lng": 80.2555,
      "metal_fingerprint": [
        "Ni",
        "Cr"
      ],
      "note": "Weathering of local mineral deposits"
    }
  ],
  "vaigai": [
    {
      "id": "vai-dye-1",
      "name": "Illustrative Garment Dyeing Unit G",
      "type": "industrial",
      "lat": 9.9265,
      "lng": 78.1215,
      "metal_fingerprint": [
        "Cr",
        "Cu"
      ],
      "note": "Fictional — represents garment dyeing category"
    },
    {
      "id": "vai-paper-1",
      "name": "Illustrative Paper Mill H",
      "type": "industrial",
      "lat": 9.924,
      "lng": 78.1185,
      "metal_fingerprint": [
        "Pb",
        "Zn"
      ],
      "note": "Fictional — represents paper/pulp manufacturing category"
    },
    {
      "id": "vai-agri-1",
      "name": "Agricultural Runoff",
      "type": "agricultural",
      "lat": 9.9275,
      "lng": 78.123,
      "metal_fingerprint": [
        "Cu",
        "Zn"
      ],
      "note": "Fertiliser / pesticide runoff"
    },
    {
      "id": "vai-sew-1",
      "name": "Urban / Sewage Outfall",
      "type": "sewage",
      "lat": 9.9235,
      "lng": 78.1175,
      "metal_fingerprint": [
        "Pb",
        "Zn",
        "Cu"
      ],
      "note": "Untreated urban discharge"
    },
    {
      "id": "vai-nat-1",
      "name": "Natural Geological Background",
      "type": "natural",
      "lat": 9.9245,
      "lng": 78.1195,
      "metal_fingerprint": [
        "Ni",
        "Cr"
      ],
      "note": "Weathering of local mineral deposits"
    }
  ],
  "palar": [
    {
      "id": "pal-tan-1",
      "name": "Illustrative Tannery Cluster I",
      "type": "industrial",
      "lat": 12.918,
      "lng": 79.1345,
      "metal_fingerprint": [
        "Cr",
        "Pb",
        "Cd"
      ],
      "note": "Fictional — represents Vellore/Ranipet tannery belt category"
    },
    {
      "id": "pal-leath-1",
      "name": "Illustrative Leather Chemical Plant J",
      "type": "industrial",
      "lat": 12.9155,
      "lng": 79.131,
      "metal_fingerprint": [
        "Cr",
        "Ni"
      ],
      "note": "Fictional — represents leather chemical processing category"
    },
    {
      "id": "pal-agri-1",
      "name": "Agricultural Runoff",
      "type": "agricultural",
      "lat": 12.919,
      "lng": 79.1355,
      "metal_fingerprint": [
        "Cu",
        "Zn"
      ],
      "note": "Fertiliser / pesticide runoff"
    },
    {
      "id": "pal-sew-1",
      "name": "Urban / Sewage Outfall",
      "type": "sewage",
      "lat": 12.9145,
      "lng": 79.13,
      "metal_fingerprint": [
        "Pb",
        "Zn",
        "Cu"
      ],
      "note": "Untreated urban discharge"
    },
    {
      "id": "pal-nat-1",
      "name": "Natural Geological Background",
      "type": "natural",
      "lat": 12.916,
      "lng": 79.132,
      "metal_fingerprint": [
        "Ni",
        "Cr"
      ],
      "note": "Weathering of local mineral deposits"
    }
  ],
  "bhavani": [
    {
      "id": "bha-ind-1",
      "name": "Illustrative Dyeing/Bleaching Unit K",
      "type": "industrial",
      "lat": 11.449,
      "lng": 77.684,
      "metal_fingerprint": [
        "Cr",
        "Cu"
      ],
      "note": "Fictional — illustrative industry category for this basin"
    },
    {
      "id": "bha-agri-1",
      "name": "Agricultural Runoff",
      "type": "agricultural",
      "lat": 11.45,
      "lng": 77.681,
      "metal_fingerprint": [
        "Cu",
        "Zn"
      ],
      "note": "Fertiliser / pesticide runoff"
    },
    {
      "id": "bha-sew-1",
      "name": "Urban / Sewage Outfall",
      "type": "sewage",
      "lat": 11.444999999999999,
      "lng": 77.683,
      "metal_fingerprint": [
        "Pb",
        "Zn",
        "Cu"
      ],
      "note": "Untreated urban discharge"
    },
    {
      "id": "bha-nat-1",
      "name": "Natural Geological Background",
      "type": "natural",
      "lat": 11.446,
      "lng": 77.68,
      "metal_fingerprint": [
        "Ni",
        "Cr"
      ],
      "note": "Weathering of local mineral deposits"
    }
  ],
  "amaravathi": [
    {
      "id": "ama-ind-1",
      "name": "Illustrative Home-Textile Dyeing Unit L",
      "type": "industrial",
      "lat": 10.957,
      "lng": 78.082,
      "metal_fingerprint": [
        "Cr",
        "Cu",
        "Zn"
      ],
      "note": "Fictional — illustrative industry category for this basin"
    },
    {
      "id": "ama-agri-1",
      "name": "Agricultural Runoff",
      "type": "agricultural",
      "lat": 10.958,
      "lng": 78.079,
      "metal_fingerprint": [
        "Cu",
        "Zn"
      ],
      "note": "Fertiliser / pesticide runoff"
    },
    {
      "id": "ama-sew-1",
      "name": "Urban / Sewage Outfall",
      "type": "sewage",
      "lat": 10.953,
      "lng": 78.081,
      "metal_fingerprint": [
        "Pb",
        "Zn",
        "Cu"
      ],
      "note": "Untreated urban discharge"
    },
    {
      "id": "ama-nat-1",
      "name": "Natural Geological Background",
      "type": "natural",
      "lat": 10.954,
      "lng": 78.078,
      "metal_fingerprint": [
        "Ni",
        "Cr"
      ],
      "note": "Weathering of local mineral deposits"
    }
  ],
  "cauvery": [
    {
      "id": "cau-ind-1",
      "name": "Illustrative Sugar/Distillery Unit M",
      "type": "industrial",
      "lat": 10.832,
      "lng": 78.692,
      "metal_fingerprint": [
        "Pb",
        "Zn"
      ],
      "note": "Fictional — illustrative industry category for this basin"
    },
    {
      "id": "cau-agri-1",
      "name": "Agricultural Runoff",
      "type": "agricultural",
      "lat": 10.833,
      "lng": 78.689,
      "metal_fingerprint": [
        "Cu",
        "Zn"
      ],
      "note": "Fertiliser / pesticide runoff"
    },
    {
      "id": "cau-sew-1",
      "name": "Urban / Sewage Outfall",
      "type": "sewage",
      "lat": 10.828,
      "lng": 78.691,
      "metal_fingerprint": [
        "Pb",
        "Zn",
        "Cu"
      ],
      "note": "Untreated urban discharge"
    },
    {
      "id": "cau-nat-1",
      "name": "Natural Geological Background",
      "type": "natural",
      "lat": 10.829,
      "lng": 78.688,
      "metal_fingerprint": [
        "Ni",
        "Cr"
      ],
      "note": "Weathering of local mineral deposits"
    }
  ],
  "periyar": [
    {
      "id": "per-ind-1",
      "name": "Illustrative Chemical/Fertiliser Plant N",
      "type": "industrial",
      "lat": 10.075000000000001,
      "lng": 76.307,
      "metal_fingerprint": [
        "Cd",
        "Ni",
        "Cr"
      ],
      "note": "Fictional — illustrative industry category for this basin"
    },
    {
      "id": "per-agri-1",
      "name": "Agricultural Runoff",
      "type": "agricultural",
      "lat": 10.076,
      "lng": 76.304,
      "metal_fingerprint": [
        "Cu",
        "Zn"
      ],
      "note": "Fertiliser / pesticide runoff"
    },
    {
      "id": "per-sew-1",
      "name": "Urban / Sewage Outfall",
      "type": "sewage",
      "lat": 10.071,
      "lng": 76.30600000000001,
      "metal_fingerprint": [
        "Pb",
        "Zn",
        "Cu"
      ],
      "note": "Untreated urban discharge"
    },
    {
      "id": "per-nat-1",
      "name": "Natural Geological Background",
      "type": "natural",
      "lat": 10.072000000000001,
      "lng": 76.30300000000001,
      "metal_fingerprint": [
        "Ni",
        "Cr"
      ],
      "note": "Weathering of local mineral deposits"
    }
  ],
  "vrishabhavathi": [
    {
      "id": "vri-ind-1",
      "name": "Illustrative Electroplating Cluster O",
      "type": "industrial",
      "lat": 12.912,
      "lng": 77.52199999999999,
      "metal_fingerprint": [
        "Cr",
        "Ni",
        "Cd"
      ],
      "note": "Fictional — illustrative industry category for this basin"
    },
    {
      "id": "vri-agri-1",
      "name": "Agricultural Runoff",
      "type": "agricultural",
      "lat": 12.913,
      "lng": 77.51899999999999,
      "metal_fingerprint": [
        "Cu",
        "Zn"
      ],
      "note": "Fertiliser / pesticide runoff"
    },
    {
      "id": "vri-sew-1",
      "name": "Urban / Sewage Outfall",
      "type": "sewage",
      "lat": 12.908,
      "lng": 77.521,
      "metal_fingerprint": [
        "Pb",
        "Zn",
        "Cu"
      ],
      "note": "Untreated urban discharge"
    },
    {
      "id": "vri-nat-1",
      "name": "Natural Geological Background",
      "type": "natural",
      "lat": 12.909,
      "lng": 77.518,
      "metal_fingerprint": [
        "Ni",
        "Cr"
      ],
      "note": "Weathering of local mineral deposits"
    }
  ],
  "musi": [
    {
      "id": "mus-ind-1",
      "name": "Illustrative Pharma/Bulk-Drug Unit P",
      "type": "industrial",
      "lat": 17.362,
      "lng": 78.49199999999999,
      "metal_fingerprint": [
        "Pb",
        "Cd",
        "Cr"
      ],
      "note": "Fictional — illustrative industry category for this basin"
    },
    {
      "id": "mus-agri-1",
      "name": "Agricultural Runoff",
      "type": "agricultural",
      "lat": 17.363,
      "lng": 78.48899999999999,
      "metal_fingerprint": [
        "Cu",
        "Zn"
      ],
      "note": "Fertiliser / pesticide runoff"
    },
    {
      "id": "mus-sew-1",
      "name": "Urban / Sewage Outfall",
      "type": "sewage",
      "lat": 17.358,
      "lng": 78.491,
      "metal_fingerprint": [
        "Pb",
        "Zn",
        "Cu"
      ],
      "note": "Untreated urban discharge"
    },
    {
      "id": "mus-nat-1",
      "name": "Natural Geological Background",
      "type": "natural",
      "lat": 17.358999999999998,
      "lng": 78.488,
      "metal_fingerprint": [
        "Ni",
        "Cr"
      ],
      "note": "Weathering of local mineral deposits"
    }
  ]
};

/** Seasonal averages — used only when Open-Meteo is unreachable. */
export const FALLBACK_WEATHER: Record<string, { ambient_temp: number; rainfall_24h: number }> =
{
  "adyar": {
    "ambient_temp": 31.5,
    "rainfall_24h": 2.0
  },
  "noyyal": {
    "ambient_temp": 33.0,
    "rainfall_24h": 12.0
  },
  "cooum": {
    "ambient_temp": 32.0,
    "rainfall_24h": 4.0
  },
  "vaigai": {
    "ambient_temp": 34.0,
    "rainfall_24h": 1.5
  },
  "palar": {
    "ambient_temp": 31.0,
    "rainfall_24h": 6.0
  },
  "bhavani": {
    "ambient_temp": 32.5,
    "rainfall_24h": 3.0
  },
  "amaravathi": {
    "ambient_temp": 33.5,
    "rainfall_24h": 2.0
  },
  "cauvery": {
    "ambient_temp": 32.0,
    "rainfall_24h": 5.0
  },
  "periyar": {
    "ambient_temp": 30.0,
    "rainfall_24h": 14.0
  },
  "vrishabhavathi": {
    "ambient_temp": 28.0,
    "rainfall_24h": 8.0
  },
  "musi": {
    "ambient_temp": 33.0,
    "rainfall_24h": 4.0
  }
};

/** Traffic-light status for a concentration, matching backend config.status_for. */
export function statusFor(metal: string, concentration: number): "normal" | "elevated" | "alert" {
  const r = METAL_RANGES[metal];
  if (concentration >= r.alert) return "alert";
  if (concentration >= r.elevated) return "elevated";
  return "normal";
}
