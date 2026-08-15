"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import type { Lake } from "@/lib/types";

const METALS = ["Pb", "Cr", "Ni", "Cu", "Cd", "Zn"];
const METAL_COLOR: Record<string, string> = {
  Pb: "#ff5d6c", Cr: "#ffb347", Ni: "#6ff0ff", Cu: "#46e5a0", Cd: "#c084fc", Zn: "#35e0d8",
};
const RANGES = [
  { label: "6h", points: 24 },
  { label: "12h", points: 48 },
  { label: "48h", points: 192 },
];

// Deterministic pseudo-rainfall so the overlay is stable across renders.
function rainfallAt(i: number) {
  const v = Math.sin(i * 0.3) + Math.sin(i * 0.11 + 1.7);
  return Math.max(0, v * 6 + (i % 17 === 0 ? 18 : 0));
}

export default function TrendsPage() {
  const { data: lakes } = useQuery({ queryKey: ["lakes"], queryFn: api.lakes });
  const buoys = (lakes ?? []).flatMap((l: Lake) =>
    l.buoys.map((b) => ({ id: b.id, name: l.name }))
  );

  const [buoyId, setBuoyId] = useState<string>("");
  const activeBuoy = buoyId || buoys[0]?.id || "";
  const [range, setRange] = useState(1);
  const [visible, setVisible] = useState<string[]>(["Pb", "Cr", "Cu"]);
  const [overlay, setOverlay] = useState(true);

  const { data: hist } = useQuery({
    queryKey: ["history", activeBuoy, RANGES[range].points],
    queryFn: () => api.history(activeBuoy, RANGES[range].points),
    enabled: !!activeBuoy,
    refetchInterval: 8000,
  });

  const data = useMemo(() => {
    const series = hist?.series ?? [];
    return series.map((row, i) => {
      const t = new Date(String(row.timestamp));
      const out: Record<string, number | string> = {
        t: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      METALS.forEach((m) => (out[m] = Number(row[m] ?? 0)));
      out.rainfall = rainfallAt(i);
      return out;
    });
  }, [hist]);

  const toggle = (m: string) =>
    setVisible((v) => (v.includes(m) ? v.filter((x) => x !== m) : [...v, m]));

  return (
    <div style={{ minHeight: "100dvh", padding: "32px 40px 60px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>Historical Trends</h1>
      <p style={{ color: "var(--text-dim)", marginTop: 8 }}>
        Estimated concentration over time. Toggle metals, switch node and range,
        and overlay rainfall to correlate spikes with weather.
      </p>

      {/* controls */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", marginTop: 22 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {buoys.map((b) => (
            <button
              key={b.id}
              onClick={() => setBuoyId(b.id)}
              className="font-mono"
              style={{
                padding: "7px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                border: "1px solid var(--line)",
                background: activeBuoy === b.id ? "var(--teal)" : "transparent",
                color: activeBuoy === b.id ? "#02080f" : "var(--text-dim)",
              }}
            >
              {b.name}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {RANGES.map((r, i) => (
            <button
              key={r.label}
              onClick={() => setRange(i)}
              className="font-mono"
              style={{
                padding: "7px 12px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                border: "1px solid var(--line)",
                background: range === i ? "var(--panel-2)" : "transparent",
                color: range === i ? "var(--text)" : "var(--text-mute)",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-dim)", cursor: "pointer" }}>
          <input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} />
          Rainfall overlay
        </label>
      </div>

      {/* metal toggles */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
        {METALS.map((m) => (
          <button
            key={m}
            onClick={() => toggle(m)}
            className="font-mono"
            style={{
              padding: "5px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer",
              border: `1px solid ${METAL_COLOR[m]}`,
              background: visible.includes(m) ? METAL_COLOR[m] : "transparent",
              color: visible.includes(m) ? "#02080f" : METAL_COLOR[m],
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* chart */}
      <div className="glass" style={{ padding: 18, marginTop: 20, height: 460 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(127,166,224,0.1)" />
            <XAxis dataKey="t" tick={{ fill: "#5c7a89", fontSize: 11 }} minTickGap={40} />
            <YAxis yAxisId="c" tick={{ fill: "#5c7a89", fontSize: 11 }} label={{ value: "µg/L", angle: -90, position: "insideLeft", fill: "#5c7a89", fontSize: 11 }} />
            <YAxis yAxisId="r" orientation="right" tick={{ fill: "#5c7a89", fontSize: 11 }} hide={!overlay} />
            <Tooltip
              contentStyle={{ background: "#1b2758", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: "#9fc0cf" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {overlay && (
              <Bar yAxisId="r" dataKey="rainfall" name="Rainfall (mm)" fill="#1c8f8a" opacity={0.28} />
            )}
            {overlay && (
              <Area yAxisId="r" dataKey="rainfall" name="" stroke="none" fill="#1c8f8a" fillOpacity={0.06} />
            )}
            {METALS.filter((m) => visible.includes(m)).map((m) => (
              <Line
                key={m}
                yAxisId="c"
                type="monotone"
                dataKey={m}
                stroke={METAL_COLOR[m]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
