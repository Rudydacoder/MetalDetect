import { NextResponse } from "next/server";
import { allAttributions } from "@/lib/demo/simulate";

export const dynamic = "force-dynamic";

/** Mirrors the backend `GET /attribution` — every currently-flagged result. */
export async function GET() {
  return NextResponse.json(allAttributions());
}
