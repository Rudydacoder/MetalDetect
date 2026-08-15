"use client";

import { useEffect, useRef } from "react";
// Bundled Leaflet CSS — served from our own build instead of the unpkg CDN, so
// the map styles load offline and don't add a render-blocking external request.
import "leaflet/dist/leaflet.css";

// Exact GPS coordinates for every monitored water body
const LAKE_COORDS: Record<string, [number, number]> = {
  adyar:  [13.0067, 80.2206],  // Adyar River, Chennai
  noyyal: [11.0168, 77.0000],  // Noyyal River, Coimbatore / Tirupur
  cooum:  [13.0827, 80.2562],  // Cooum River, Chennai Central
  vaigai: [9.9252,  78.1198],  // Vaigai River, Madurai
  palar:  [12.9165, 79.1325],  // Palar River, Vellore / Ranipet
};

export interface BuoyNode {
  buoyId: string;
  lakeName: string;
  lakeKey: string;
  status: "normal" | "elevated" | "alert";
  color: string;
  lat: number;
  lng: number;
}

interface SatelliteMapProps {
  nodes: BuoyNode[];
  onBuoyClick?: (buoyId: string) => void;
}

const STATUS_PULSE: Record<string, string> = {
  normal:   "#46e5a0",
  elevated: "#ffb347",
  alert:    "#ff5d6c",
};

export default function SatelliteMap({ nodes, onBuoyClick }: SatelliteMapProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletMap  = useRef<any>(null);
  const markersRef  = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // ── CRITICAL: use a `cancelled` flag to guard the async promise ──
    // In React StrictMode the effect fires twice. The cleanup sets
    // leafletMap.current = null but the async import resolves AFTER the
    // cleanup fires, so without this flag both promises race to call
    // L.map() on the same DOM node → "Map container is already initialized".
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !mapRef.current) return;
      // Also guard against a previous (non-cancelled) map already attached
      if ((mapRef.current as any)._leaflet_id) return;

      // Every buoy uses a custom divIcon (below), so Leaflet's default marker
      // images are never rendered — no need to wire up their icon URLs.

      // Centre on Tamil Nadu
      const map = L.map(mapRef.current, {
        center: [11.0, 78.9],
        zoom: 7,
        zoomControl: true,
        attributionControl: true,
      });
      leafletMap.current = map;

      // Esri World Imagery — satellite tiles, Google Earth quality
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 18,
        }
      ).addTo(map);

      // City / boundary label overlay
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { opacity: 0.65, maxZoom: 18 }
      ).addTo(map);

      // Draw buoy markers
      nodes.forEach((node) => {
        const coords = LAKE_COORDS[node.lakeKey] ?? ([node.lat, node.lng] as [number, number]);
        const color  = STATUS_PULSE[node.status] ?? "#35e0d8";

        const icon = L.divIcon({
          className: "",
          iconSize:   [24, 24],
          iconAnchor: [12, 12],
          html: `
            <div style="
              width:24px;height:24px;border-radius:50%;
              background:${color};
              box-shadow:0 0 0 3px rgba(2,8,15,0.85), 0 0 14px ${color}, 0 0 28px ${color}66;
              display:flex;align-items:center;justify-content:center;
              ${node.status === "alert" ? "animation:lf-pulse 1.8s ease-in-out infinite;" : ""}
            ">
              <div style="width:8px;height:8px;border-radius:50%;background:#fff;opacity:0.9;"></div>
            </div>
          `,
        });

        const marker = L.marker(coords, { icon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;min-width:190px;">
              <strong style="font-size:14px;letter-spacing:-0.02em;">${node.lakeName}</strong><br/>
              <span style="font-size:11px;color:#8899aa;">${node.buoyId}</span><br/>
              <span style="
                display:inline-block;margin-top:7px;padding:3px 11px;
                border-radius:999px;border:1px solid ${color};
                color:${color};font-size:11px;font-weight:700;letter-spacing:0.05em;
              ">${node.status.toUpperCase()}</span>
            </div>`,
            { maxWidth: 230 }
          );

        marker.on("click", () => onBuoyClick?.(node.buoyId));
        markersRef.current.push(marker);
      });

      // Fit all buoys into view
      if (nodes.length > 0) {
        const latLngs = nodes.map(
          (n) => LAKE_COORDS[n.lakeKey] ?? ([n.lat, n.lng] as [number, number])
        );
        if (latLngs.length === 1) {
          map.setView(latLngs[0], 13);
        } else {
          map.fitBounds(latLngs as [number, number][], { padding: [55, 55] });
        }
      }
    });

    return () => {
      cancelled = true;
      leafletMap.current?.remove();
      leafletMap.current = null;
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live status colour updates (no map re-create needed)
  useEffect(() => {
    if (!leafletMap.current || markersRef.current.length === 0) return;
    markersRef.current.forEach((marker, i) => {
      const node = nodes[i];
      if (!node) return;
      const color = STATUS_PULSE[node.status] ?? "#35e0d8";
      const el = marker.getElement()?.querySelector("div");
      if (el) {
        el.style.background = color;
        el.style.boxShadow = `0 0 0 3px rgba(2,8,15,0.85), 0 0 14px ${color}, 0 0 28px ${color}66`;
      }
    });
  }, [nodes]);

  return (
    <>
      <style>{`
        @keyframes lf-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 1;    transform: scale(1.22); }
        }
        .leaflet-popup-content-wrapper {
          background: #02080f !important;
          color: #e8f6fb !important;
          border: 1px solid rgba(53,224,216,0.2) !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.65) !important;
        }
        .leaflet-popup-tip         { background: #02080f !important; }
        .leaflet-popup-close-button { color: #9fc0cf !important; }
        .leaflet-control-zoom a {
          background: #02080f !important;
          color: #35e0d8 !important;
          border-color: rgba(53,224,216,0.25) !important;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        }
        .leaflet-control-zoom a:hover { background: #0b1f30 !important; }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution {
          background: rgba(2,8,15,0.75) !important;
          color: #5c7a89 !important;
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a { color: #35e0d8 !important; }
      `}</style>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </>
  );
}
