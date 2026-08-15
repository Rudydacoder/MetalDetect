"use client";

/**
 * BufferOverlay — the shared loading buffer visual: a fully black screen that
 * splits down the middle and opens to reveal the page, with the animated
 * MetalDetect liquid-metal logo centred (not large) while it waits.
 *
 * Presentational only — callers drive `open` (boot screen on window load,
 * per-route buffers on their content becoming ready).
 */
import MetalLogo from "./MetalLogo";
import "./BufferOverlay.css";

export default function BufferOverlay({
  open,
  label = "Initialising live water network…",
  logoSize = 188,
  logoResolution = 512,
}: {
  open: boolean;
  label?: string;
  logoSize?: number;
  logoResolution?: number;
}) {
  return (
    <div className={`buffer${open ? " buffer--open" : ""}`} aria-hidden={open}>
      <div className="buffer__half buffer__half--top" />
      <div className="buffer__half buffer__half--bottom" />

      <div className="buffer__core">
        <MetalLogo size={logoSize} resolution={logoResolution} />
        <div className="buffer__label">{label}</div>
      </div>
    </div>
  );
}
