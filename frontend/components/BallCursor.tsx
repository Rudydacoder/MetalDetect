"use client";

/**
 * BallCursor — replaces the native pointer with a physics-driven ball. The ball
 * chases the real cursor on a spring (so it lags and overshoots slightly),
 * stretches along its velocity vector (fast motion = elongated, still = round),
 * and swells when hovering something clickable. Disabled on touch / no-hover
 * devices, where it would just be dead weight.
 */
import { useEffect, useRef } from "react";
import "./BallCursor.css";

export default function BallCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;

    document.body.classList.add("ball-cursor-active");
    const dot = dotRef.current!;
    const ring = ringRef.current!;

    // target = real pointer; ring lags behind on a spring, dot tracks tightly.
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...target };
    const ringVel = { x: 0, y: 0 };
    const dotPos = { ...target };
    let hovering = 0;      // eased 0→1 when over interactive elements
    let hoverTarget = 0;
    let down = 0;          // eased press state
    let downTarget = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const el = e.target as HTMLElement | null;
      const interactive = !!el?.closest(
        'a, button, [role="button"], input, textarea, select, label, [data-cursor="hover"]'
      );
      hoverTarget = interactive ? 1 : 0;
    };
    const onDown = () => (downTarget = 1);
    const onUp = () => (downTarget = 0);
    const onLeave = () => {
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };
    const onEnter = () => {
      dot.style.opacity = "1";
      ring.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    const K = 0.16;   // spring stiffness for the ring
    const D = 0.72;   // damping

    const loop = () => {
      // spring the ring toward the target
      const ax = (target.x - ringPos.x) * K;
      const ay = (target.y - ringPos.y) * K;
      ringVel.x = (ringVel.x + ax) * D;
      ringVel.y = (ringVel.y + ay) * D;
      ringPos.x += ringVel.x;
      ringPos.y += ringVel.y;

      // dot tracks tightly
      dotPos.x += (target.x - dotPos.x) * 0.5;
      dotPos.y += (target.y - dotPos.y) * 0.5;

      // velocity → stretch along direction of travel
      const speed = Math.hypot(ringVel.x, ringVel.y);
      const angle = Math.atan2(ringVel.y, ringVel.x);
      const stretch = Math.min(speed / 26, 0.6);

      hovering += (hoverTarget - hovering) * 0.15;
      down += (downTarget - down) * 0.25;

      const base = 1 + hovering * 0.9 - down * 0.25;
      const sx = base * (1 + stretch);
      const sy = base * (1 - stretch);

      ring.style.transform =
        `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%) ` +
        `rotate(${angle}rad) scale(${sx}, ${sy})`;
      ring.style.borderColor =
        hovering > 0.5 ? "var(--gold)" : "var(--brand-200)";

      dot.style.transform =
        `translate3d(${dotPos.x}px, ${dotPos.y}px, 0) translate(-50%, -50%) scale(${1 - down * 0.4})`;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.body.classList.remove("ball-cursor-active");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="ball-cursor__ring" aria-hidden />
      <div ref={dotRef} className="ball-cursor__dot" aria-hidden />
    </>
  );
}
