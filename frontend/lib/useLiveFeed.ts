"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_MODE, LIVE_POLL_URL, WS_URL } from "./api";
import type { LiveUpdate, Status } from "./types";

export interface LiveState {
  /** latest LiveUpdate per buoy_id */
  byBuoy: Record<string, LiveUpdate>;
  connected: boolean;
}

/** How often demo mode polls for fresh readings. */
const POLL_MS = 5000;

/**
 * Keeps the latest update per buoy.
 *
 * With a real backend it subscribes to the WebSocket and auto-reconnects with a
 * short backoff, so the demo survives a backend restart. In demo mode (no
 * NEXT_PUBLIC_API_BASE — e.g. a bare Vercel deployment) serverless can't hold a
 * socket open, so it polls `/api/live` on an interval instead. Both paths fill
 * the same `byBuoy` map, so callers don't care which is running.
 */
export function useLiveFeed(): LiveState {
  const [byBuoy, setByBuoy] = useState<Record<string, LiveUpdate>>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let closed = false;

    // ---- Demo mode: poll the built-in snapshot endpoint ----
    if (DEMO_MODE || !WS_URL) {
      let timer: ReturnType<typeof setTimeout> | null = null;

      const poll = async () => {
        try {
          const res = await fetch(LIVE_POLL_URL, { cache: "no-store" });
          if (!res.ok) throw new Error(String(res.status));
          const { updates } = (await res.json()) as {
            updates: Record<string, LiveUpdate>;
          };
          if (closed) return;
          setByBuoy(updates ?? {});
          setConnected(true);
        } catch {
          if (!closed) setConnected(false);
        } finally {
          if (!closed) timer = setTimeout(poll, POLL_MS);
        }
      };

      poll();
      return () => {
        closed = true;
        if (timer) clearTimeout(timer);
      };
    }

    // ---- Real backend: WebSocket with reconnect ----
    // Captured locally so it stays narrowed to `string` inside the closure.
    const url: string = WS_URL;
    const connect = () => {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onmessage = (ev) => {
        try {
          const update = JSON.parse(ev.data) as LiveUpdate;
          setByBuoy((prev) => ({ ...prev, [update.reading.buoy_id]: update }));
        } catch {
          /* ignore malformed frames */
        }
      };
      ws.onclose = () => {
        setConnected(false);
        if (!closed) {
          retry.current = setTimeout(connect, 1500);
        }
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      if (retry.current) clearTimeout(retry.current);
      wsRef.current?.close();
    };
  }, []);

  return { byBuoy, connected };
}

export function worstStatus(statuses: Status[]): Status {
  const order: Status[] = ["normal", "elevated", "alert"];
  return statuses.reduce<Status>(
    (worst, s) => (order.indexOf(s) > order.indexOf(worst) ? s : worst),
    "normal"
  );
}
