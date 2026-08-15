"use client";

/**
 * LoadingScreen — the initial boot buffer.
 *
 * Covers the whole viewport on first load (the Overview route pulls in fonts,
 * three.js, a GLB globe and WebGL shaders, so there is a real cold-start cost)
 * and shows the animated liquid-metal logo. Once the page has finished loading
 * it opens: the two halves slide apart to reveal the app.
 *
 * Ready signal = the window `load` event, floored at a short minimum so it
 * never just flashes and capped by a hard fallback so it can never hang.
 * Mounts once in the root layout, so it only plays on the initial visit — not
 * on client-side tab switches (those get their own ScreenLoader).
 */
import { useEffect, useState } from "react";
import BufferOverlay from "./BufferOverlay";

const MIN_MS = 700;
const MAX_MS = 5000;

export default function LoadingScreen() {
  const [opening, setOpening] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const start = Date.now();
    let opened = false;

    const open = () => {
      if (opened) return;
      opened = true;
      const wait = Math.max(0, MIN_MS - (Date.now() - start));
      window.setTimeout(() => setOpening(true), wait);
    };

    if (document.readyState === "complete") open();
    else window.addEventListener("load", open, { once: true });
    const fallback = window.setTimeout(open, MAX_MS);

    return () => {
      window.removeEventListener("load", open);
      window.clearTimeout(fallback);
    };
  }, []);

  useEffect(() => {
    if (!opening) return;
    // Signal that the first load is handled, so per-route ScreenLoaders start
    // taking over from here (they suppress themselves until this flips true).
    (window as unknown as { __MD_BOOTED__?: boolean }).__MD_BOOTED__ = true;
    const t = window.setTimeout(() => setDone(true), 950);
    return () => window.clearTimeout(t);
  }, [opening]);

  if (done) return null;
  return <BufferOverlay open={opening} logoSize={200} logoResolution={560} />;
}
