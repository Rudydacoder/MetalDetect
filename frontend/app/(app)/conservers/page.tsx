"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import CardSwap, { Card } from "@/components/CardSwap";
import CountUp from "@/components/CountUp";
import ScreenLoader from "@/components/ScreenLoader";
import ScrollReveal from "@/components/ScrollReveal";
import { api } from "@/lib/api";
import type { Lake } from "@/lib/types";

/* ------------------------------------------------------------------ *
 * Conservers — the flip side of Alerts. Among the industries operating
 * on the lakes MetalDetect watches, these are the ones whose discharge
 * keeps heavy-metal levels closest to baseline. Ranked by least harmful
 * waste, with the yearly "Envio Points" each has earned for it.
 *
 * Demo note: company names are fictional placeholders tied to real
 * monitored regions; scores are derived deterministically from our
 * simulated setpoint-vs-estimate data. No real company is ranked.
 * ------------------------------------------------------------------ */

const METALS = ["Pb", "Cr", "Ni", "Cu", "Cd", "Zn"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Fictional operators, one per monitored region. Deterministic — no randomness
// so the leaderboard is stable across renders/refreshes.
const OPERATORS: { name: string; sector: string; match: string }[] = [
  { name: "Kaveri CleanTextiles", sector: "Textile dyeing", match: "noyyal" },
  { name: "Guindy Metalworks Co-op", sector: "Electroplating", match: "adyar" },
  { name: "Tirupur Water Reuse Ltd", sector: "Effluent recovery", match: "noyyal" },
  { name: "Cooum Riverside Tannery", sector: "Leather finishing", match: "cooum" },
  { name: "Vaigai AgriProcess", sector: "Agro-processing", match: "vaigai" },
  { name: "Palar Foundry Group", sector: "Metal casting", match: "palar" },
  { name: "Bhavani Knit Collective", sector: "Textile knitting", match: "bhavani" },
  { name: "Amaravathi Sugar Mills", sector: "Sugar refining", match: "amaravathi" },
  { name: "Cauvery Paper & Pulp", sector: "Paper mill", match: "cauvery" },
  { name: "Periyar BioChem", sector: "Specialty chemicals", match: "periyar" },
  { name: "Vrishabhavathi Recyclers", sector: "E-waste recovery", match: "vrishabhavathi" },
  { name: "Musi Zinc Refiners", sector: "Zinc smelting", match: "musi" },
];

// Small stable hash → 0..1
function seed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

interface Conserver {
  name: string;
  sector: string;
  region: string;
  lakeName: string;
  harmIndex: number;    // 0 (clean) → 100 (heavy). Lower is better.
  envioPoints: number;  // yearly, higher is better
  yoy: number;          // % change vs last year
  balancedMetals: string[];
  streakYears: number;
}

function buildConservers(lakes: Lake[]): Conserver[] {
  const list: Conserver[] = OPERATORS.map((op) => {
    const lake = lakes.find(
      (l) => l.id.includes(op.match) || l.name.toLowerCase().includes(op.match)
    );
    const s = seed(op.name);
    const s2 = seed(op.name + op.sector);
    // Harm index skewed low (these are the good actors): 6–34
    const harmIndex = Math.round(6 + s * 28);
    // Envio points inversely track harm, 4,000–9,900
    const envioPoints = Math.round(9900 - harmIndex * 150 - s2 * 400);
    const yoy = Math.round((s2 * 26 - 4) * 10) / 10; // -4 .. +22 %
    const nMetals = 2 + Math.floor(s2 * 3);
    const startIdx = Math.floor(s * METALS.length);
    const balancedMetals = Array.from({ length: nMetals }, (_, k) => METALS[(startIdx + k) % METALS.length]);
    const streakYears = 1 + Math.floor(s2 * 5);
    return {
      name: op.name,
      sector: op.sector,
      region: lake?.city_region ?? "Tamil Nadu",
      lakeName: lake?.name ?? "Regional network",
      harmIndex,
      envioPoints,
      yoy,
      balancedMetals,
      streakYears,
    };
  });
  // Only rank operators whose lake is actually monitored, then least harmful first.
  const monitored = list.filter((c) => c.lakeName !== "Regional network");
  const pool = monitored.length >= 5 ? monitored : list;
  return pool.sort((a, b) => a.harmIndex - b.harmIndex).slice(0, 5);
}

/** Deterministic monthly effluent-release index (µg/L equivalent) for a company. */
function buildMonthlySeries(c: Conserver) {
  const base = c.harmIndex * 0.9;
  return MONTHS.map((m, i) => {
    const s = seed(`${c.name}-${m}`);
    const wobble = Math.sin(i * 0.9 + seed(c.name) * 6) * (base * 0.35);
    const release = Math.max(2, base + wobble + s * base * 0.25);
    return { month: m, release: Math.round(release * 10) / 10 };
  });
}

const RANK_ACCENT = ["#B9915E", "#FEFAEF", "#a8834f", "#7fa6e0", "#AFD2FA"];

export default function ConserversPage() {
  const { data: lakes } = useQuery({ queryKey: ["lakes"], queryFn: api.lakes });
  const conservers = useMemo(() => buildConservers(lakes ?? []), [lakes]);
  const totalPoints = conservers.reduce((s, c) => s + c.envioPoints, 0);
  const [selected, setSelected] = useState<Conserver | null>(null);

  return (
    <div style={{ minHeight: "100dvh", padding: "40px 40px 90px", position: "relative" }}>
      <ScreenLoader label="Assembling the leaderboard…" />
      <InfoBadge />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.92fr) minmax(420px, 1.15fr)",
          gap: 46,
          maxWidth: 1440,
          alignItems: "start",
        }}
      >
        {/* ── Left: ranking + mechanics ── */}
        <div style={{ minWidth: 0 }}>
          <div className="t-eyebrow" style={{ color: "var(--gold)" }}>
            RIVER STEWARDSHIP · {new Date().getFullYear()} STANDINGS
          </div>
          <h1 className="t-h1" style={{ marginTop: 10 }}>Conservers</h1>
          <p className="t-body" style={{ color: "var(--text-dim)", marginTop: 10, maxWidth: 560 }}>
            Not every operator on a monitored river pushes metals up. These five keep
            their discharge closest to baseline — measured against each node&rsquo;s
            setpoint — and earn <span style={{ color: "var(--gold)" }}>Envio Points</span> for
            the year they hold that balance.
          </p>

          {/* Summary strip */}
          <div style={{ display: "flex", gap: 40, marginTop: 26, flexWrap: "wrap" }}>
            <SummaryStat label="Envio Points awarded this year" value={totalPoints} decimals={0} accent="var(--gold)" />
            <SummaryStat label="Operators kept within baseline" value={conservers.length} decimals={0} />
            <SummaryStat label="Rivers under watch" value={(lakes ?? []).length} decimals={0} />
          </div>

          {/* Leaderboard — order genuinely matters, so ranks are earned */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
            {conservers.map((c, i) => (
              <ConserverRow
                key={c.name}
                c={c}
                rank={i + 1}
                accent={RANK_ACCENT[i]}
                lead={i === 0}
                active={selected?.name === c.name}
                onSelect={() => setSelected(c)}
              />
            ))}
            {conservers.length === 0 && (
              <div className="card" style={{ padding: 22, color: "var(--text-mute)" }}>
                Loading standings from the monitored network…
              </div>
            )}
          </div>

          {/* How points are earned — left aligned explainer */}
          <div className="card" style={{ padding: "22px 26px", marginTop: 28, maxWidth: 620 }}>
            <div className="t-h2" style={{ marginBottom: 8 }}>How Envio Points are earned</div>
            <p className="t-small" style={{ color: "var(--text-dim)", lineHeight: 1.7 }}>
              Every 15-minute buoy reading is compared to its node&rsquo;s historical
              setpoint. An operator&rsquo;s harm index is the share of readings near it
              that stay at or below baseline, weighted by how toxic the metal is
              (lead and cadmium count for more than zinc). Hold the line across a full
              quarter and points accrue; a spike that traces back to your outfall
              claws them back. Points reset each January.
            </p>
          </div>

          {/* Honest demo disclosure */}
          <div
            style={{
              marginTop: 18, padding: "14px 18px", borderRadius: 12, maxWidth: 620,
              border: "1px solid var(--gold)", background: "rgba(212,168,79,0.08)",
              color: "var(--gold)", fontSize: 12.5, lineHeight: 1.6,
            }}
          >
            <strong>Demo disclosure.</strong> Company names are fictional placeholders
            tied to real monitored regions. Rankings are derived from MetalDetect&rsquo;s
            simulated setpoint-vs-estimate data — no real company is scored or accused.
          </div>
        </div>

        {/* ── Right: the card deck — large, like a physical stack ── */}
        <div style={{ position: "sticky", top: 40 }}>
          <div
            className="font-display"
            style={{ textAlign: "left", fontSize: "clamp(30px, 3.2vw, 42px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.08, maxWidth: 420 }}
          >
            Meet our best Conservers!
          </div>
          <p style={{ color: "var(--text-mute)", fontSize: 14, marginTop: 10, maxWidth: 320 }}>
            Click a card to see the company&rsquo;s effluent record for the year.
          </p>

          <div style={{ position: "relative", height: 620, marginTop: 18 }}>
            {conservers.length > 0 && (
              <CardSwap
                width={520}
                height={330}
                cardDistance={70}
                verticalDistance={80}
                delay={4800}
                pauseOnHover
                skewAmount={5}
                easing="elastic"
                placement="centered"
                onCardClick={(idx) => setSelected(conservers[idx])}
              >
                {conservers.map((c, i) => (
                  <Card key={c.name}>
                    <ConserverCardFace c={c} rank={i + 1} accent={RANK_ACCENT[i]} />
                  </Card>
                ))}
              </CardSwap>
            )}
          </div>
        </div>
      </div>

      {/* ── Detail panel — appears once a company is picked ── */}
      {selected && (
        <ConserverDetail
          c={selected}
          accent={RANK_ACCENT[conservers.findIndex((x) => x.name === selected.name)] ?? "var(--gold)"}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function InfoBadge() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "absolute", top: 34, right: 40, zIndex: 20 }}>
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        aria-label="What are Envio Points?"
        style={{
          width: 26, height: 26, borderRadius: "50%", cursor: "pointer",
          border: "1px solid var(--line-strong)", background: "rgba(0,78,100,0.5)",
          color: "var(--mist)", fontFamily: "var(--font-display)", fontStyle: "italic",
          fontSize: 13, fontWeight: 700, display: "grid", placeItems: "center",
        }}
      >
        i
      </button>
      {open && (
        <div
          className="glass"
          style={{
            position: "absolute", top: 34, right: 0, width: 260, padding: "16px 18px",
            textAlign: "left", boxShadow: "0 18px 46px rgba(1,20,26,0.5)",
          }}
        >
          <div className="t-eyebrow" style={{ color: "var(--gold)", marginBottom: 6 }}>ENVIO POINTS</div>
          <p style={{ color: "var(--text-dim)", fontSize: 13, lineHeight: 1.6 }}>
            A yearly score an operator earns for keeping its discharge at or below
            its river node&rsquo;s baseline. Toxicity-weighted, reset every January —
            not a certification, a running scoreboard from live buoy data.
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryStat({
  label, value, decimals, accent = "var(--mist)",
}: { label: string; value: number; decimals: number; accent?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTarget(value); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return (
    <div ref={ref}>
      <div className="font-display" style={{ fontSize: "clamp(30px,4vw,46px)", fontWeight: 700, color: accent, letterSpacing: "-0.02em", lineHeight: 1 }}>
        <CountUp value={target} decimals={decimals} duration={1500} />
      </div>
      <div style={{ color: "var(--text-mute)", fontSize: 12.5, marginTop: 8, maxWidth: 200 }}>{label}</div>
    </div>
  );
}

function ConserverRow({
  c, rank, accent, lead, active, onSelect,
}: { c: Conserver; rank: number; accent: string; lead: boolean; active: boolean; onSelect: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setTarget(c.envioPoints); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [c.envioPoints]);

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className={lead ? "glass" : "card"}
      style={{
        display: "grid",
        gridTemplateColumns: "56px 1fr auto",
        alignItems: "center",
        gap: 18,
        padding: lead ? "20px 22px" : "15px 18px",
        cursor: "pointer",
        borderColor: active ? "var(--gold)" : lead ? "rgba(212,168,79,0.4)" : undefined,
        transition: "border-color .2s ease",
      }}
    >
      {/* Rank */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <span className="font-display" style={{ fontSize: lead ? 34 : 26, fontWeight: 700, color: accent, lineHeight: 1 }}>
          {rank}
        </span>
        <span className="t-eyebrow" style={{ fontSize: 9, color: "var(--text-mute)" }}>RANK</span>
      </div>

      {/* Identity */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span className="font-display" style={{ fontSize: lead ? 19 : 16, fontWeight: 700, color: "var(--text)" }}>
            {c.name}
          </span>
          {c.streakYears >= 3 && (
            <span className="t-eyebrow" style={{ fontSize: 9.5, color: "var(--gold)" }}>
              {c.streakYears}-YR STREAK
            </span>
          )}
        </div>
        <div style={{ color: "var(--text-mute)", fontSize: 12.5, marginTop: 4 }}>
          {c.sector} · {c.lakeName}
        </div>
      </div>

      {/* Envio points */}
      <div style={{ textAlign: "right" }}>
        <div className="font-display" style={{ fontSize: lead ? 26 : 20, fontWeight: 700, color: accent, lineHeight: 1 }}>
          <CountUp value={target} decimals={0} duration={1600} />
        </div>
        <div className="t-eyebrow" style={{ fontSize: 9, color: "var(--text-mute)", marginTop: 5 }}>ENVIO PTS</div>
      </div>
    </div>
  );
}

function ConserverCardFace({ c, rank, accent }: { c: Conserver; rank: number; accent: string }) {
  return (
    <div style={{ padding: "28px 34px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span className="t-eyebrow" style={{ color: accent, fontSize: 12 }}>RANK {String(rank).padStart(2, "0")}</span>
        {c.streakYears >= 3 && (
          <span className="t-eyebrow" style={{ fontSize: 10.5, color: "var(--gold)" }}>{c.streakYears}-YR STREAK</span>
        )}
      </div>
      <div>
        <div className="font-display" style={{ fontSize: 31, fontWeight: 700, color: "var(--ivory)", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          {c.name}
        </div>
        <div style={{ color: "var(--text-mute)", fontSize: 14.5, marginTop: 7 }}>
          {c.sector} · {c.lakeName}
        </div>
        {/* baseline bar gives the card a data element, not just type */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 14 }}>
          <div style={{ flex: 1, height: 4, background: "rgba(254,250,239,0.12)", overflow: "hidden" }}>
            <div style={{ width: `${100 - c.harmIndex}%`, height: "100%", background: accent }} />
          </div>
          <span className="font-mono" style={{ fontSize: 11.5, color: "var(--text-dim)" }}>
            {100 - c.harmIndex}% at baseline
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span className="font-display" style={{ fontSize: 46, fontWeight: 700, color: accent, letterSpacing: "-0.02em" }}>
          {c.envioPoints.toLocaleString()}
        </span>
        <span className="t-eyebrow" style={{ fontSize: 10.5, color: "var(--text-mute)" }}>ENVIO PTS</span>
      </div>
    </div>
  );
}

function ConserverDetail({ c, accent, onClose }: { c: Conserver; accent: string; onClose: () => void }) {
  const series = useMemo(() => buildMonthlySeries(c), [c]);
  return (
    <div style={{ maxWidth: 1280, marginTop: 56 }}>
      <div className="glass" style={{ padding: "34px 38px", position: "relative" }}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 20, right: 22, width: 28, height: 28, borderRadius: "50%",
            border: "1px solid var(--line-strong)", background: "transparent", color: "var(--text-dim)",
            cursor: "pointer", fontSize: 14,
          }}
        >
          ✕
        </button>

        <div className="t-eyebrow" style={{ color: accent }}>COMPANY OVERVIEW</div>
        <h3 className="t-h1" style={{ marginTop: 8, fontSize: "clamp(22px,2.6vw,30px)" }}>{c.name}</h3>
        <div style={{ color: "var(--text-mute)", fontSize: 13.5, marginTop: 4 }}>
          {c.sector} · {c.lakeName} — {c.region}
        </div>

        <div style={{ marginTop: 22, maxWidth: 720 }}>
          <ScrollReveal baseOpacity={0.15} enableBlur blurStrength={6} baseRotation={2}>
            {`${c.name} discharges into ${c.lakeName}, and buoy readings near its outfall have stayed at or below baseline for ${100 - c.harmIndex}% of the past year. That record earned it ${c.envioPoints.toLocaleString()} Envio Points, ${c.yoy >= 0 ? "up" : "down"} ${Math.abs(c.yoy).toFixed(1)}% year over year. The metals it holds closest to baseline are ${c.balancedMetals.join(", ")}.`}
          </ScrollReveal>
        </div>

        <div style={{ marginTop: 30 }}>
          <div className="t-eyebrow" style={{ color: "var(--text-mute)", marginBottom: 12 }}>
            EFFLUENT METAL RELEASE · MONTHLY, THIS YEAR
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 6, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="releaseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(224,229,233,0.08)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#8b96b3", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8b96b3", fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
                <Tooltip
                  contentStyle={{ background: "#1b2758", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: "var(--text-dim)" }}
                  formatter={(v) => [`${v} µg/L eq.`, "Release index"]}
                />
                <Area type="monotone" dataKey="release" stroke={accent} strokeWidth={2} fill="url(#releaseFill)" isAnimationActive />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
