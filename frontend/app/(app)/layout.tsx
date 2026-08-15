"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import BallCursor from "@/components/BallCursor";
import MetalLogo from "@/components/MetalLogo";
import OptionWheel from "@/components/OptionWheel";
import TabBackground from "@/components/TabBackground";

const NAV: { label: string; route: string }[] = [
  { label: "Overview", route: "/overview" },
  { label: "Live Network", route: "/network" },
  { label: "Alerts", route: "/alerts" },
  { label: "Trends", route: "/trends" },
  { label: "Conservers", route: "/conservers" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    const idx = NAV.findIndex((n) => pathname.startsWith(n.route));
    if (idx === -1 && pathname.startsWith("/lake")) return 1; // lake detail ⊂ network
    return idx === -1 ? 0 : idx;
  }, [pathname]);

  // Overview keeps its bespoke globe + AcidSquares hero; every other tab shares
  // the DarkVeil ambient backdrop.
  const showVeil = !pathname.startsWith("/overview");

  return (
    <div style={{ minHeight: "100dvh", position: "relative" }}>
      <BallCursor />
      {showVeil && <TabBackground />}

      {/* Site logo — the animated liquid-metal mark, top-centre, links home. */}
      <Link
        href="/overview"
        aria-label="MetalDetect home"
        style={{
          position: "fixed",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 70,
          display: "block",
        }}
      >
        <MetalLogo size={46} resolution={240} />
      </Link>

      <main style={{ minHeight: "100dvh", position: "relative", zIndex: 1 }}>{children}</main>

      {/* No sidebar — a thin left-edge zone reveals just the circular nav wheel
          on hover, then hides again on leave. */}
      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: open ? 232 : 22,
          zIndex: 60,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          aria-hidden={!open}
          style={{
            width: 212,
            height: "62%",
            transform: open ? "translateX(0)" : "translateX(-118%)",
            opacity: open ? 1 : 0,
            transition:
              "transform .38s cubic-bezier(.4,.85,.2,1), opacity .28s ease",
            pointerEvents: open ? "auto" : "none",
            // faint left-edge gradient so the wheel stays legible over the globe
            maskImage: "linear-gradient(90deg, #000 70%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(90deg, #000 70%, transparent 100%)",
          }}
        >
          <OptionWheel
            items={NAV.map((n) => n.label)}
            selectedIndex={selected}
            side="left"
            fontSize={1.5}
            spacing={1.55}
            tilt={7}
            blur={1.5}
            fade={0.3}
            smoothing={220}
            inset={26}
            draggable
            soundUrl="/sounds/click-soft.wav"
            soundVolume={0.3}
            textColor="#121a3c"
            activeColor="#B9915E"
            onChange={(i) => router.push(NAV[i].route)}
          />
        </div>
      </div>
    </div>
  );
}
