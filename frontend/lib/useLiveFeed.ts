"use client";

import { useEffect, useRef, useState } from "react";
import { WS_URL } from "./api";
import type { LiveUpdate, Status } from "./types";

export interface LiveState {
  /** latest LiveUpdate per buoy_id */
  byBuoy: Record<string, LiveUpdate>;
  connected: boolean;
}

/**
 * Subscribes to the backend WebSocket and keeps the latest update per buoy.
 * Auto-reconnects with a short backoff so the demo survives a backend restart.
 */
export function useLiveFeed(): LiveState {
  const [byBuoy, setByBuoy] = useState<Record<string, LiveUpdate>>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let closed = false;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
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
