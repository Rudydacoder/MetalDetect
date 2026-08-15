"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import AnimatedList from "@/components/AnimatedList";
import { api } from "@/lib/api";
import {
  TYPE_LABEL,
  type AttributionResult,
  type CandidateType,
} from "@/lib/types";

/* Source types read as materials, not a rainbow: industrial is the alarm
   colour, everything else sits in the ocean/sand range. */
const TYPE_COLOR: Record<CandidateType, string> = {
  industrial: "#e0697a",
  agricultural: "#B9915E",
  sewage: "#4a6bb5",
  natural: "#5fb894",
};

const METAL_COLOR: Record<string, string> = {
  Pb: "#e0697a", Cr: "#B9915E", Ni: "#7fa6e0", Cu: "#5fb894", Cd: "#b58ad6", Zn: "#AFD2FA",
};

interface AlertRow {
  metal: string;
  node: string;
  time: string;
}

export default function AlertsPage() {
  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: api.alerts,
    refetchInterval: 4000,
  });
  const { data: lakes } = useQuery({ queryKey: ["lakes"], queryFn: api.lakes });
  const [selected, setSelected] = useState<string | null>(null);

  const flagged = useMemo(
    () => (alerts ?? []).filter((a) => a.status === "flagged"),
    [alerts]
  );

  useEffect(() => {
    if (!selected && flagged.length) setSelected(flagged[0].buoy_id);
  }, [flagged, selected]);

  const active: AttributionResult | undefined = flagged.find(
    (a) => a.buoy_id === selected
  );

  const nodeName = (buoyId: string) => {
    for (const lk of lakes ?? []) if (lk.buoys.some((b) => b.id === buoyId)) return lk.name;
    return buoyId;
  };
  const feedItems: AlertRow[] = flagged.flatMap((a, ai) =>
    a.triggered_metals.map((m, mi) => ({
      metal: m,
      node: nodeName(a.buoy_id),
      time: `${ai * 3 + mi * 2 + 1}m ago`,
    }))
  );

  const metalTally = useMemo(() => {
    const t: Record<string, number> = {};
    flagged.forEach((a) => a.triggered_metals.forEach((m) => (t[m] = (t[m] ?? 0) + 1)));
    return Object.entries(t).sort((a, b) => b[1] - a[1]);
  }, [flagged]);

  return (
    <div style={{ minHeight: "100dvh", padding: "0 0 60px" }}>
      {/* ── Masthead: rule-topped editorial header ───────────────────── */}
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          padding: "38px 44px 26px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="t-eyebrow" style={{ color: "var(--gold)" }}>
            SOURCE ATTRIBUTION
          </div>
          <h1
            className="font-display"
            style={{ fontSize: "clamp(34px, 4.6vw, 58px)", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1, marginTop: 12 }}
          >
            Alerts
          </h1>
          <p style={{ color: "var(--text-dim)", marginTop: 12, maxWidth: 520, fontSize: 15, lineHeight: 1.6 }}>
            Every flagged reading, ranked against the outfalls and land uses near
            that node. Rule-based and inspectable — no black box.
          </p>
        </div>

        {/* live counters, right-aligned as a data rail */}
        <div style={{ display: "flex", gap: 34, alignItems: "flex-end" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="pulse-glow" style={{ width: 8, height: 8, borderRadius: 999, background: "var(--red)" }} />
              <span className="font-display" style={{ fontSize: 46, fontWeight: 700, lineHeight: 1, color: "var(--red)" }}>
                {flagged.length}
              </span>
            </div>
            <div className="t-eyebrow" style={{ fontSize: 9.5, color: "var(--text-mute)", marginTop: 8 }}>
              FLAGGED NODES
            </div>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: 46, fontWeight: 700, lineHeight: 1, color: "var(--ivory)" }}>
              {metalTally.length}
            </div>
            <div className="t-eyebrow" style={{ fontSize: 9.5, color: "var(--text-mute)", marginTop: 8 }}>
              METALS TRIGGERED
            </div>
          </div>
        </div>
      </header>

      {flagged.length === 0 ? (
        <div style={{ padding: "80px 44px", color: "var(--text-mute)", maxWidth: 520 }}>
          <div className="t-h2" style={{ color: "var(--text)" }}>Network within baseline</div>
          <p style={{ marginTop: 10, lineHeight: 1.7 }}>
            No node is above its setpoint right now. A simulated spike will
            surface here within a minute or two.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(300px, 0.82fr) minmax(0, 1.35fr)",
            gap: 0,
            alignItems: "stretch",
          }}
        >
          {/* ── Left rail: the feed ─────────────────────────────────── */}
          <section
            style={{
              borderRight: "1px solid var(--line)",
              padding: "26px 26px 26px 44px",
              display: "flex",
              flexDirection: "column",
              height: "calc(100dvh - 60px)",
              position: "sticky",
              top: 0,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
              <span className="t-eyebrow" style={{ color: "var(--text-mute)" }}>Alert feed</span>
              <span className="font-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                {feedItems.length} events
              </span>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <AnimatedList<AlertRow>
                items={feedItems}
                displayScrollbar
                renderItem={(item, isSelected) => <AlertCard item={item} selected={isSelected} />}
              />
            </div>
          </section>

          {/* ── Right: node picker + attribution ────────────────────── */}
          <section style={{ padding: "26px 44px 26px 34px", minWidth: 0 }}>
            {/* node picker — a quiet underline tab strip, not a pill cluster */}
            <div
              style={{
                display: "flex",
                gap: 4,
                overflowX: "auto",
                borderBottom: "1px solid var(--line)",
                paddingBottom: 0,
                marginBottom: 26,
              }}
            >
              {flagged.map((a) => {
                const on = selected === a.buoy_id;
                return (
                  <button
                    key={a.buoy_id}
                    onClick={() => setSelected(a.buoy_id)}
                    style={{
                      padding: "10px 16px 12px",
                      background: "transparent",
                      border: "none",
                      borderBottom: `2px solid ${on ? "var(--gold)" : "transparent"}`,
                      color: on ? "var(--ivory)" : "var(--text-mute)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      fontFamily: "var(--font-display)",
                      fontWeight: on ? 600 : 400,
                      fontSize: 14,
                      transition: "color .18s ease, border-color .18s ease",
                    }}
                  >
                    {nodeName(a.buoy_id)}
                    <span className="font-mono" style={{ fontSize: 10.5, color: on ? "var(--gold)" : "var(--slate-400)", marginLeft: 8 }}>
                      {a.triggered_metals.join(" ")}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* selected node headline — ivory slab, the one light surface */}
            {active && (
              <div
                className="surface-ivory"
                style={{ padding: "22px 26px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap", borderRadius: 4 }}
              >
                <div>
                  <div className="t-eyebrow" style={{ fontSize: 9.5, color: "#5c6d76" }}>NODE UNDER REVIEW</div>
                  <div className="font-display" style={{ fontSize: 26, fontWeight: 700, color: "var(--on-light)", marginTop: 6, letterSpacing: "-0.02em" }}>
                    {nodeName(active.buoy_id)}
                  </div>
                  <div className="font-mono" style={{ fontSize: 12, color: "#5c6d76", marginTop: 4 }}>
                    {active.buoy_id}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {active.triggered_metals.map((m) => (
                    <div key={m} style={{ textAlign: "center" }}>
                      <div
                        className="font-display"
                        style={{
                          width: 46, height: 46, borderRadius: 4, display: "grid", placeItems: "center",
                          fontSize: 17, fontWeight: 700, color: "#fff",
                          background: METAL_COLOR[m] ?? "#e0697a",
                        }}
                      >
                        {m}
                      </div>
                      <div className="t-eyebrow" style={{ fontSize: 8.5, color: "#5c6d76", marginTop: 6 }}>OVER</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ranked candidates — editorial list with oversized rank numerals */}
            <div style={{ marginTop: 34 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                <h2 className="font-display" style={{ fontSize: 20, fontWeight: 600 }}>Ranked candidate sources</h2>
                <span className="font-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>CONFIDENCE</span>
              </div>

              {active?.ranked_candidates.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "54px 1fr auto",
                    gap: 18,
                    alignItems: "start",
                    padding: "22px 0",
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <span
                    className="font-display"
                    style={{
                      fontSize: 34, fontWeight: 700, lineHeight: 0.9,
                      color: i === 0 ? TYPE_COLOR[c.type] : "var(--slate)",
                      opacity: i === 0 ? 1 : 0.65,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div style={{ minWidth: 0 }}>
                    <div className="font-display" style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", lineHeight: 1.3 }}>
                      {c.name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7, flexWrap: "wrap" }}>
                      <span
                        className="t-eyebrow"
                        style={{ fontSize: 9, color: TYPE_COLOR[c.type], borderLeft: `2px solid ${TYPE_COLOR[c.type]}`, paddingLeft: 7 }}
                      >
                        {TYPE_LABEL[c.type]}
                      </span>
                      {c.matched_metals.length > 0 && (
                        <span className="font-mono" style={{ fontSize: 11, color: "var(--text-mute)" }}>
                          matches {c.matched_metals.join(", ")}
                        </span>
                      )}
                    </div>
                    {c.note && (
                      <div style={{ fontSize: 12.5, color: "var(--slate-400)", marginTop: 7, lineHeight: 1.55 }}>
                        {c.note}
                      </div>
                    )}
                    {/* bar sits under the text, full measure */}
                    <div style={{ height: 3, background: "rgba(254,250,239,0.09)", marginTop: 14, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${c.confidence * 100}%` }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        style={{ height: "100%", background: TYPE_COLOR[c.type] }}
                      />
                    </div>
                  </div>

                  <span
                    className="font-display"
                    style={{ fontSize: 26, fontWeight: 700, color: c.confidence > 0 ? TYPE_COLOR[c.type] : "var(--slate)", lineHeight: 1 }}
                  >
                    {(c.confidence * 100).toFixed(0)}
                    <span style={{ fontSize: 13, marginLeft: 1 }}>%</span>
                  </span>
                </div>
              ))}
            </div>

            {/* disclaimer — a quiet footnote, not another amber alert box */}
            <p
              style={{
                marginTop: 26,
                paddingTop: 18,
                borderTop: "1px solid var(--line)",
                color: "var(--slate-400)",
                fontSize: 12,
                lineHeight: 1.65,
                maxWidth: 620,
              }}
            >
              {active?.disclaimer ??
                "Flagged for investigation only — not a determination of responsibility. Industrial markers are illustrative and fictional."}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function AlertCard({ item, selected }: { item: AlertRow; selected: boolean }) {
  const c = METAL_COLOR[item.metal] ?? "#e0697a";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: "14px 14px 14px 0",
        borderBottom: "1px solid var(--line)",
        background: selected ? "rgba(254,250,239,0.045)" : "transparent",
        transition: "background .18s ease",
      }}
    >
      <span
        style={{
          width: 3,
          alignSelf: "stretch",
          background: c,
          opacity: selected ? 1 : 0.55,
          transition: "opacity .18s ease",
        }}
      />
      <span
        className="font-display"
        style={{
          width: 38, height: 38, flexShrink: 0, borderRadius: 3,
          display: "grid", placeItems: "center", fontWeight: 700, fontSize: 14,
          color: c, background: `${c}1a`,
        }}
      >
        {item.metal}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
          {item.node}
        </div>
        <div className="font-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 3 }}>
          {item.metal} over baseline · {item.time}
        </div>
      </div>
    </div>
  );
}
