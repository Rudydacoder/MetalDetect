import { NextResponse } from "next/server";
import { allLatest } from "@/lib/demo/simulate";

export const dynamic = "force-dynamic";

/**
 * Polling stand-in for the backend's `WS /live`.
 *
 * Vercel's serverless runtime can't hold a WebSocket open, so the demo layer
 * exposes a snapshot endpoint instead and `useLiveFeed` polls it. Returns the
 * latest update for every buoy, keyed by buoy_id — the same shape the socket
 * pushes, just batched.
 */
export async function GET() {
  return NextResponse.json({ updates: allLatest() });
}
