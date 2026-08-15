"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AcidSquares from "@/components/AcidSquares";
import CyberGlobe from "@/components/CyberGlobe";
import MetalLogo from "@/components/MetalLogo";
import ScreenLoader from "@/components/ScreenLoader";
import ScrollReveal from "@/components/ScrollReveal";
import VariableProximity from "@/components/VariableProximity";

const NEW_HEADLINE = "Know what’s in your water, the moment it changes.";
const NEW_BODY =
  "MetalDetect is a real-time, continuous heavy-metal monitoring system that quantifies contamination at the source, replacing delayed snapshots with live water-quality intelligence.";

export default function OverviewPage() {
  const router = useRouter();
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const menuHintRef = useRef<HTMLDivElement>(null);

  // Scroll blurs + lifts the wordmark out as the new copy rises to replace it.
  // The two landing hints (scroll cue, menu hint) fade out on the same curve
  // so they're gone before the reveal copy arrives underneath them.
  // Applied straight in the scroll handler (writing plain style props) so it
  // stays correct even where rAF is throttled.
  useEffect(() => {
    const apply = () => {
      const vh = window.innerHeight;
      const p = Math.min(Math.max(window.scrollY / (vh * 0.6), 0), 1);
      if (heroCopyRef.current) {
        heroCopyRef.current.style.filter = `blur(${p * 16}px)`;
        heroCopyRef.current.style.opacity = String(Math.max(1 - p * 1.5, 0));
        heroCopyRef.current.style.transform = `translateY(${-p * 48}px)`;
      }
      const hintOpacity = String(Math.max(0.5 - p * 0.75, 0));
      if (scrollCueRef.current) scrollCueRef.current.style.opacity = hintOpacity;
      if (menuHintRef.current) menuHintRef.current.style.opacity = hintOpacity;
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    return () => window.removeEventListener("scroll", apply);
  }, []);

  return (
    <div style={{ position: "relative", background: "#101838" }}>
      <ScreenLoader label="Rendering the globe…" />

      {/* Site logo — animated liquid-metal mark, Overview top-left only. */}
      <div style={{ position: "fixed", top: 18, left: 30, zIndex: 30 }}>
        <MetalLogo size={52} resolution={256} />
      </div>

      {/* "Hover for menu" — left-centre, vertical, pointing at the hidden nav
          wheel's hover zone. pointer-events: none so it never blocks the
          hover that actually reveals the wheel. */}
      <div
        ref={menuHintRef}
        aria-hidden
        style={{
          position: "fixed",
          left: 20,
          top: "50%",
          zIndex: 20,
          transform: "translateY(-50%) rotate(180deg)",
          opacity: 0.5,
          pointerEvents: "none",
          writingMode: "vertical-rl",
        }}
      >
        <span className="t-eyebrow" style={{ color: "#FEFAEF" }}>
          Hover for menu
        </span>
      </div>

      {/* Bottom-centre scroll cue — a small chevron that pops upward on a
          loop, inviting the scroll into the reveal copy below. */}
      <div
        ref={scrollCueRef}
        aria-hidden
        style={{
          position: "fixed",
          bottom: 26,
          left: "50%",
          zIndex: 20,
          transform: "translateX(-50%)",
          opacity: 0.5,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 7,
        }}
      >
        <svg
          className="overview-scroll-pop"
          width="14"
          height="8"
          viewBox="0 0 14 8"
          fill="none"
        >
          <path
            d="M1 7L7 1L13 7"
            stroke="#FEFAEF"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="t-eyebrow" style={{ color: "#FEFAEF" }}>
          Scroll
        </span>
      </div>

      {/* AcidSquares — the Overview background animation, tuned to the palette. */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <AcidSquares
          color1="#182350"
          color2="#AFD2FA"
          color3="#FEFAEF"
          detail="medium"
          speed={0.55}
          waveDepth={1}
          zoom={1.3}
          density={10}
          glow={1.0}
          exposure={2900}
          spread={0.3}
          brightness={1.0}
          opacity={0.9}
          mouseInteraction
          mouseStrength={0.12}
          mouseRadius={0.35}
          grain
          grainIntensity={0.04}
        />
      </div>

      <section style={{ position: "relative", zIndex: 1 }}>
        {/* ── Sticky hero: globe + proximity wordmark ── */}
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100dvh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <CyberGlobe />
          </div>

          {/* vignette so the wordmark reads over the globe */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: "radial-gradient(58% 46% at 50% 44%, rgba(16,24,56,0.78) 0%, transparent 72%)",
            }}
          />

          <div
            ref={heroCopyRef}
            style={{
              position: "relative",
              zIndex: 2,
              textAlign: "center",
              padding: "0 6vw",
              willChange: "filter, opacity, transform",
            }}
          >
            <div ref={heroContainerRef} style={{ position: "relative", display: "inline-block" }}>
              <VariableProximity
                label="MetalDetect"
                containerRef={heroContainerRef}
                radius={140}
                falloff="exponential"
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 900, 'opsz' 40"
                fromColor="#FEFAEF"
                toColor="#AFD2FA"
                style={{
                  fontSize: "clamp(52px, 10vw, 140px)",
                  color: "#FEFAEF",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  textShadow: "0 12px 60px rgba(0,0,0,0.55)",
                }}
              />
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(15px, 1.9vw, 21px)",
                color: "#AFD2FA",
                marginTop: 20,
                fontWeight: 500,
              }}
            >
              Buoy readings update every 15 minutes across 11 rivers
            </p>
            {/* wordless scroll cue */}
            <div style={{ marginTop: 34, display: "flex", justifyContent: "center" }}>
              <span
                style={{
                  display: "block",
                  width: 1,
                  height: 42,
                  background: "linear-gradient(#AFD2FA, transparent)",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Reveal flow: new copy rises over the globe as you scroll ──
             The dark blend spans the FULL viewport width (a separate absolute
             layer) so there are no visible column edges; the text sits in a
             centred column on top of it. */}
        <div style={{ position: "relative", zIndex: 2, marginTop: "-34vh" }}>
          {/* full-bleed blend, no borders — melts the globe into the deep blue */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(180deg, rgba(16,24,56,0) 0%, rgba(16,24,56,0.6) 16%, #101838 38%, #101838 100%)",
            }}
          />
          <div
            style={{
              position: "relative",
              maxWidth: 1200,
              margin: "0 auto",
              padding: "48vh 7vw 42vh",
            }}
          >
            <ScrollReveal
              baseOpacity={0}
              enableBlur
              baseRotation={4}
              blurStrength={10}
              containerClassName="overview-reveal-headline"
            >
              {NEW_HEADLINE}
            </ScrollReveal>

            <ScrollReveal
              baseOpacity={0}
              enableBlur
              baseRotation={2}
              blurStrength={8}
              containerClassName="overview-reveal-body"
            >
              {NEW_BODY}
            </ScrollReveal>

            <CTAReveal onClick={() => router.push("/network")} />
          </div>
        </div>
      </section>

      <style>{`
        .overview-reveal-headline .scroll-reveal-text {
          font-family: var(--font-display);
          font-size: clamp(42px, 7vw, 96px);
          font-weight: 700;
          letter-spacing: -0.035em;
          line-height: 1.04;
          color: #FEFAEF;
        }
        .overview-reveal-headline .scroll-reveal-text .word { color: #FEFAEF; }
        .overview-reveal-body { margin-top: 36px; }
        .overview-reveal-body .scroll-reveal-text {
          font-family: var(--font-body);
          font-size: clamp(20px, 2.6vw, 32px);
          font-weight: 400;
          line-height: 1.55;
          color: #c9d2e4;
          max-width: 880px;
        }
        .overview-reveal-body .scroll-reveal-text .word { color: #c9d2e4; }

        @keyframes overviewScrollPop {
          0%, 100% { transform: translateY(0); opacity: 0.55; }
          50%      { transform: translateY(-6px); opacity: 1; }
        }
        .overview-scroll-pop {
          animation: overviewScrollPop 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .overview-scroll-pop { animation: none; }
        }
      `}</style>
    </div>
  );
}

/** The "Live network" CTA — fades and lifts in the first time it scrolls into view. */
function CTAReveal({ onClick }: { onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        marginTop: 44,
        opacity: shown ? 1 : 0,
        filter: shown ? "blur(0px)" : "blur(8px)",
        transform: shown ? "translateY(0)" : "translateY(24px)",
        transition: "opacity .7s ease, filter .7s ease, transform .7s cubic-bezier(.2,.7,.2,1)",
      }}
    >
      <button
        onClick={onClick}
        className="cta-gold"
        style={{ padding: "16px 34px", fontSize: 16, display: "inline-flex", alignItems: "center", gap: 10 }}
      >
        Live network
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}
