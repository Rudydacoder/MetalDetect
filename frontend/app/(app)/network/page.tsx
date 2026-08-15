"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import BorderGlow from "@/components/BorderGlow";
import PixelCard from "@/components/PixelCard";
import ScreenLoader from "@/components/ScreenLoader";
import { api } from "@/lib/api";
import { useLiveFeed } from "@/lib/useLiveFeed";
import { STATUS_COLOR, type Lake, type Status } from "@/lib/types";

// Dynamically import the satellite map — Leaflet requires the browser's `window`
const SatelliteMap = dynamic(() => import("@/components/SatelliteMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 520,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-mute)",
        fontSize: 13,
        letterSpacing: "0.08em",
      }}
    >
      Loading satellite map…
    </div>
  ),
});

/** Map a lake name / id to the lakeKey used by SatelliteMap's coordinate table */
function resolveLakeKey(lakeName: string, lakeId?: string): string {
  // Try exact id first
  const id = (lakeId ?? "").toLowerCase();
  if (id) return id; // adyar, noyyal, cooum, vaigai, palar

  const lower = lakeName.toLowerCase();
  if (lower.includes("adyar"))  return "adyar";
  if (lower.includes("noyyal") || lower.includes("noyyar")) return "noyyal";
  if (lower.includes("cooum"))  return "cooum";
  if (lower.includes("vaigai")) return "vaigai";
  if (lower.includes("palar"))  return "palar";
  return lower.split(/\s+/)[0];
}

/** Pick the PixelCard variant based on buoy status */
function variantForStatus(status: Status): string {
  if (status === "alert")    return "red";
  if (status === "elevated") return "amber";
  return "teal";
}

export default function NetworkPage() {
  const router = useRouter();
  const { byBuoy } = useLiveFeed();
  const { data: lakes } = useQuery({ queryKey: ["lakes"], queryFn: api.lakes });

  const nodes = (lakes ?? []).flatMap((lake: Lake) =>
    lake.buoys.map((b) => {
      const live = byBuoy[b.id];
      const status: Status = live?.overall_status ?? b.status ?? "normal";
      return { lake, buoy: b, status, live };
    })
  );

  const mapNodes = nodes.map(({ lake, buoy, status }) => ({
    buoyId:   buoy.id,
    lakeName: lake.name,
    lakeKey:  resolveLakeKey(lake.name, lake.id),
    status,
    color:    STATUS_COLOR[status],
    lat:      buoy.lat,
    lng:      buoy.lng,
  }));

  return (
    <div style={{ minHeight: "100dvh", padding: "32px 40px 60px" }}>
      <ScreenLoader label="Loading the network map…" />
      <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>
        Live Network
      </h1>
      <p style={{ color: "var(--text-dim)", marginTop: 8, fontSize: 15 }}>
        All monitored buoys across Tamil Nadu — status-coded and updating live.
        Select a node to drill into its readings.
      </p>

      <div style={{ marginTop: 26 }}>
        {/* ── Satellite map panel — full width so the node grid can breathe ── */}
        <BorderGlow
          backgroundColor="#1b2758"
          borderRadius={14}
          glowColor="8 121 181"
          colors={["#4a6bb5", "#7fa6e0", "#182350"]}
        >
          <div
            style={{
              position: "relative",
              height: 460,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <SatelliteMap
              nodes={mapNodes}
              onBuoyClick={(id) => router.push(`/lake/${id}`)}
            />

            {/* HUD label */}
            <div
              className="font-mono"
              style={{
                position: "absolute",
                top: 14,
                left: 16,
                fontSize: 11,
                color: "var(--text-mute)",
                zIndex: 1000,
                pointerEvents: "none",
                background: "rgba(16,24,56,0.8)",
                padding: "4px 12px",
                borderRadius: 4,
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(74,107,181,0.35)",
                letterSpacing: "0.1em",
              }}
            >
              TAMIL NADU · SATELLITE · LIVE
            </div>
          </div>
        </BorderGlow>

        {/* ── Node grid — flows across the full width instead of piling up
               in a narrow right-hand column ── */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 34, marginBottom: 14 }}>
          <h2 className="font-display" style={{ fontSize: 19, fontWeight: 600 }}>Monitored nodes</h2>
          <span className="font-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
            {nodes.length} BUOYS
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {nodes.map(({ lake, buoy, status, live }) => {
            const color = STATUS_COLOR[status];
            const worst = live?.estimates
              ?.slice()
              .sort(
                (a, b) => b.estimated_concentration - a.estimated_concentration
              )[0];

            return (
              <PixelCard
                key={buoy.id}
                variant={variantForStatus(status)}
                style={{ borderRadius: 10 }}
              >
                <button
                  onClick={() => router.push(`/lake/${buoy.id}`)}
                  style={{
                    padding: "18px 20px",
                    textAlign: "left",
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    width: "100%",
                    display: "block",
                    outline: "none",
                  }}
                >
                  {/* Name + status badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 16,
                        letterSpacing: "-0.02em",
                        color: "var(--text)",
                      }}
                    >
                      {lake.name}
                    </span>
                    {/* status reads as a signal mark, not another pill */}
                    <span
                      className="font-mono"
                      style={{
                        color,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        className={status === "alert" ? "pulse-glow" : undefined}
                        style={{ width: 7, height: 7, borderRadius: 999, background: color }}
                      />
                      {status.toUpperCase()}
                    </span>
                  </div>

                  {/* Buoy id + region */}
                  <div
                    style={{
                      color: "var(--text-mute)",
                      fontSize: 12,
                      marginTop: 5,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {buoy.id} · {lake.city_region}
                  </div>

                  {/* Live readings row */}
                  {live && (
                    <div
                      className="font-mono"
                      style={{
                        display: "flex",
                        gap: 14,
                        marginTop: 12,
                        fontSize: 12,
                        color: "var(--text-dim)",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>pH {live.reading.pH.toFixed(2)}</span>
                      <span>{live.reading.water_temp.toFixed(1)}°C</span>
                      {worst && (
                        <span style={{ color, fontWeight: 600 }}>
                          {worst.metal} {worst.estimated_concentration.toFixed(1)} µg/L
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </PixelCard>
            );
          })}

          {nodes.length === 0 && (
            <div
              className="glass"
              style={{ padding: 18, color: "var(--text-mute)", borderRadius: 16 }}
            >
              Loading nodes…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
