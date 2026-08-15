"use client";

/**
 * LoadingScreen — the boot buffer.
 *
 * Shows a branded splash over the whole viewport on first load (the Overview
 * route pulls in fonts, three.js, a GLB globe and WebGL shaders, so there is a
 * real cold-start cost). Once the page has finished loading it "opens": the two
 * halves slide apart to reveal the app underneath.
 *
 * Ready signal = the window `load` event (all initial resources), floored at a
 * short minimum so it never just flashes, and capped by a hard fallback so it
 * can never get stuck if `load` is missed. Mounts once in the root layout, so
 * it only plays on the initial visit — not on client-side tab switches.
 */
import { useEffect, useState } from "react";
import "./LoadingScreen.css";

const MIN_MS = 700; // don't flash — always show at least this long
const MAX_MS = 4500; // safety net — never hang the UI behind the splash

export default function LoadingScreen() {
  const [opening, setOpening] = useState(false); // halves start sliding apart
  const [done, setDone] = useState(false); // fully removed from the DOM

  useEffect(() => {
    const start = Date.now();
    let opened = false;

    const open = () => {
      if (opened) return;
      opened = true;
      const wait = Math.max(0, MIN_MS - (Date.now() - start));
      window.setTimeout(() => setOpening(true), wait);
    };

    if (document.readyState === "complete") {
      open();
    } else {
      window.addEventListener("load", open, { once: true });
    }
    const fallback = window.setTimeout(open, MAX_MS);

    return () => {
      window.removeEventListener("load", open);
      window.clearTimeout(fallback);
    };
  }, []);

  // Remove the overlay from the DOM after the open animation has played, so it
  // stops capturing pointer events and can be garbage-collected.
  useEffect(() => {
    if (!opening) return;
    const t = window.setTimeout(() => setDone(true), 950);
    return () => window.clearTimeout(t);
  }, [opening]);

  if (done) return null;

  return (
    <div className={`boot${opening ? " boot--open" : ""}`} aria-hidden={opening}>
      <div className="boot__half boot__half--top" />
      <div className="boot__half boot__half--bottom" />

      <div className="boot__core">
        <div className="boot__radar">
          <span className="boot__ring" />
          <span className="boot__ring" />
          <span className="boot__ring" />
          <span className="boot__dot" />
        </div>
        <div className="boot__word">
          Metal<span className="boot__word-accent">Detect</span>
        </div>
        <div className="boot__sub">Initialising live water network…</div>
      </div>
    </div>
  );
}
