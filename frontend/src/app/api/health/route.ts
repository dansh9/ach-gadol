import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — public liveness probe.
 *
 * Deliberately makes no outbound calls and discloses nothing about
 * configuration. Detailed diagnostics live at /api/health/deep and require
 * the admin key (AG-SEC-06).
 */
export async function GET() {
  return NextResponse.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
