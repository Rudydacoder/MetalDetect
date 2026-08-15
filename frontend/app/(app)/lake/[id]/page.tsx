"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LineChart, Line, YAxis, ResponsiveContainer } from "recharts";
import BuoyModel from "@/components/BuoyModel";
import BorderGlow from "@/components/BorderGlow";
import CountUp from "@/components/CountUp";
import { api } from "@/lib/api";
import { useLiveFeed } from "@/lib/useLiveFeed";
import { STATUS_COLOR, type Lake, type Status } from "@/lib/types";

const METAL_MAX: Record<string, number> = {
  Pb: 60, Cr: 100, Ni: 80, Cu: 120, Cd: 12, Zn: 240,
};

function statusVar(s: Status) {
  return s === "normal" ? "green" : s === "elevated" ? "amber" : "red";
}

export default function LakeDetail() {
  const { id } = useParams<{ id: string }>();
  const { byBuoy } = useLiveFeed();
  const update = byBuoy[id];

  const { data: lakes } = useQuery({ queryKey: ["lakes"], queryFn: api.lakes });
  const { data: hist } = useQuery({
    queryKey: ["history", id],
    queryFn: () => api.history(id, 96),
    refetchInterval: 8000,
  });

  const lake: Lake | undefined = (lakes ?? []).find((l) =>
    l.buoys.some((b) => b.id === id)
  );
  const reading = update?.reading;
  const estimates = update?.estimates ?? [];

  return (
    <div style={{ minHeight: "100dvh", padding: "32px 40px 60px" }}>
      {/* breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
        <Link href="/network" style={{ color: "var(--teal)", textDecoration: "none" }}>
          ← Live Network
        </Link>
        <span style={{ color: "var(--text-mute)" }}>/</span>
        <span style={{ color: "var(--text-dim)" }}>{lake?.name ?? id}</span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 12 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700 }}>{lake?.name ?? id}</h1>
        <span style={{ color: "var(--text-dim)" }}>{lake?.city_region}</span>
        {update && (
          <span
            className="font-mono"
            style={{
              marginLeft: "auto",
              padding: "6px 14px",
              borderRadius: 999,
              border: `1px solid var(--${statusVar(update.overall_status)})`,
              color: `var(--${statusVar(update.overall_status)})`,
              fontSize: 12,
              letterSpacing: "0.1em",
            }}
          >
            {update.overall_status.toUpperCase()}
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(320px, 1fr) minmax(360px, 1.2fr)",
          gap: 28,
          marginTop: 24,
          alignItems: "stretch",
        }}
      >
        {/* 3D buoy */}
        <BorderGlow
          backgroundColor="#1b2758"
          borderRadius={22}
          glowColor="47 146 171"
          style={{ minHeight: 460 }}
        >
          <div style={{ height: 460, position: "relative" }}>
            <BuoyModel />
            <div
              style={{
                position: "absolute",
                left: 18,
                bottom: 16,
                fontSize: 12,
                color: "var(--text-mute)",
              }}
              className="font-mono"
            >
              v4 passive-flow buoy · drag to rotate
            </div>
          </div>
        </BorderGlow>

        {/* readouts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* aux sensors */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            <AuxTile label="pH" value={reading?.pH} decimals={2} />
            <AuxTile label="Cond. µS" value={reading?.conductivity} decimals={0} />
            <AuxTile label="Temp °C" value={reading?.water_temp} decimals={1} />
            <AuxTile label="Batt. V" value={reading?.battery_voltage} decimals={2} />
          </div>

          {/* per-metal gauges */}
          <div className="glass" style={{ padding: 18, flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span style={{ fontWeight: 600 }}>Estimated concentration (µg/L)</span>
              <span className="font-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                {reading
                  ? new Date(reading.timestamp).toLocaleTimeString()
                  : "waiting…"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {estimates.length === 0 && (
                <div style={{ color: "var(--text-mute)" }}>Connecting to live feed…</div>
              )}
              {estimates.map((e) => {
                const pct = Math.min(
                  100,
                  (e.estimated_concentration / (METAL_MAX[e.metal] ?? 100)) * 100
                );
                const color = STATUS_COLOR[e.status];
                const series =
                  hist?.series?.map((row) => ({ v: Number(row[e.metal] ?? 0) })) ?? [];
                return (
                  <div
                    key={e.metal}
                    style={{ display: "grid", gridTemplateColumns: "40px 1fr 74px 60px", gap: 10, alignItems: "center" }}
                  >
                    <span className="font-display" style={{ fontWeight: 700 }}>
                      {e.metal}
                    </span>
                    <div
                      style={{
                        height: 9,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: color,
                          boxShadow: `0 0 12px ${color}`,
                          transition: "width .7s cubic-bezier(.3,.7,.2,1)",
                        }}
                      />
                    </div>
                    <span className="font-mono" style={{ textAlign: "right", color }}>
                      <CountUp value={e.estimated_concentration} decimals={1} />
                    </span>
                    <div style={{ height: 26 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series}>
                          <YAxis hide domain={["dataMin", "dataMax"]} />
                          <Line
                            type="monotone"
                            dataKey="v"
                            stroke={color}
                            strokeWidth={1.4}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {update?.attribution && update.attribution.status === "flagged" && (
            <Link
              href="/alerts"
              className="glass"
              style={{
                padding: "14px 18px",
                textDecoration: "none",
                color: "var(--red)",
                border: "1px solid var(--red)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>⚠ Attribution flagged · {update.attribution.triggered_metals.join(", ")}</span>
              <span style={{ fontSize: 13 }}>View candidates →</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function AuxTile({
  label,
  value,
  decimals,
}: {
  label: string;
  value?: number;
  decimals: number;
}) {
  return (
    <div className="glass" style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 11, color: "var(--text-mute)", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div className="font-mono" style={{ fontSize: 22, marginTop: 4 }}>
        {value == null ? "—" : <CountUp value={value} decimals={decimals} />}
      </div>
    </div>
  );
}
