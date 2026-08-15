"use client";

/**
 * ScreenLoader — a per-route loading buffer for the heavy screens.
 *
 * Shows the black split buffer with the metallic logo on mount, then opens
 * when the route's heavy content is ready:
 *   - 3D routes (globe / buoy): waits on drei's `useProgress` — it stays up
 *     until the GLB + textures have finished streaming, then opens;
 *   - non-3D heavy routes (map, card deck): no THREE load ever starts, so it
 *     opens after a short settle once the page has mounted and painted.
 *
 * On the very first document load the boot `LoadingScreen` is already covering
 * the app, so ScreenLoader suppresses itself then to avoid a double overlay.
 * It only plays on client-side navigation into a heavy screen.
 */
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import BufferOverlay from "./BufferOverlay";

const MIN_MS = 450; // never flash
const SETTLE_MS = 850; // if no 3D load starts, treat the page as ready
const MAX_MS = 6000; // hard safety net

export default function ScreenLoader({
  label = "Loading…",
}: {
  label?: string;
}) {
  const { active } = useProgress();
  const [opening, setOpening] = useState(false);
  const [done, setDone] = useState(false);
  const seen = useRef(false); // has any 3D loading started?
  const start = useRef(0);
  const suppressed = useRef<boolean | null>(null);

  useEffect(() => {
    if (suppressed.current === null) {
      // The boot screen owns the first load; only take over on later navigations.
      suppressed.current = !(window as unknown as { __MD_BOOTED__?: boolean })
        .__MD_BOOTED__;
      start.current = Date.now();
    }
    if (suppressed.current) {
      setDone(true);
      return;
    }

    const id = window.setInterval(() => {
      if (active) seen.current = true;
      const el = Date.now() - start.current;
      const loadedDone = seen.current && !active; // 3D finished streaming
      const noLoad = !seen.current && el >= SETTLE_MS; // nothing heavy to wait on
      if (el >= MAX_MS || (el >= MIN_MS && (loadedDone || noLoad))) {
        setOpening(true);
        window.clearInterval(id);
      }
    }, 120);
    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!opening) return;
    const t = window.setTimeout(() => setDone(true), 950);
    return () => window.clearTimeout(t);
  }, [opening]);

  if (done) return null;
  return <BufferOverlay open={opening} label={label} logoSize={168} logoResolution={512} />;
}
