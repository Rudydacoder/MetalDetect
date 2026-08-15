"use client";

/**
 * MetalLogo — the MetalDetect wordless mark rendered as animated liquid metal.
 * A single square wrapper so the same logo drops into the boot screen, the
 * per-route buffers and the site header at whatever size the caller wants.
 */
import MetallicPaint from "./MetallicPaint";

const LOGO_SRC = "/logo.svg";

export default function MetalLogo({
  size = 200,
  resolution = 512,
}: {
  /** Rendered square size in px. */
  size?: number;
  /** Internal shader resolution — keep small for tiny logos. */
  resolution?: number;
}) {
  return (
    <div
      style={{ width: size, height: size, lineHeight: 0 }}
      aria-label="MetalDetect logo"
      role="img"
    >
      <MetallicPaint
        imageSrc={LOGO_SRC}
        resolution={resolution}
        // Pattern
        seed={42}
        scale={4}
        patternSharpness={1}
        noiseScale={0.5}
        // Animation
        speed={0.3}
        liquid={0.75}
        mouseAnimation={false}
        // Visual
        brightness={2}
        contrast={0.5}
        refraction={0.01}
        blur={0.015}
        chromaticSpread={2}
        fresnel={1}
        angle={0}
        waveAmplitude={1}
        distortion={1}
        contour={0.2}
        // Colors
        lightColor="#ffffff"
        darkColor="#000000"
        tintColor="#feb3ff"
      />
    </div>
  );
}
