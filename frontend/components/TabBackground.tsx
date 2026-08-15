"use client";

/**
 * TabBackground — the shared ambient backdrop for every tab except Overview.
 * A fixed DarkVeil veil, hue-tuned to the deep blue, with a deep-blue wash on
 * top so foreground panels/text stay readable.
 */
import DarkVeil from "./DarkVeil";

export default function TabBackground() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
        <DarkVeil
          hueShift={232}
          speed={0.35}
          warpAmount={0.9}
          noiseIntensity={0.03}
          scanlineIntensity={0.06}
          scanlineFrequency={1.4}
          resolutionScale={1}
        />
      </div>
      {/* deep-blue wash: keeps content legible over the veil while holding the
          field in the Deep Blue → Powder Blue range */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 100% at 78% -10%, rgba(74,107,181,0.28) 0%, rgba(24,35,80,0.82) 52%, rgba(16,24,56,0.94) 100%)",
        }}
      />
    </div>
  );
}
