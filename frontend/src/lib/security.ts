import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Shared security helpers.
 *
 * Kept in one place so every endpoint compares secrets the same way: hashing
 * both sides first means differing lengths never throw and the comparison
 * leaks nothing about the expected value.
 */

/** Constant-time string comparison. Returns false rather than throwing. */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Guard for admin-only routes.
 * Returns a response to send back, or null when the caller is authorised.
 *
 * Fails closed: if ADMIN_API_KEY is unset or too short, the route is
 * unavailable rather than open.
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_API_KEY;

  if (!expected || expected.length < 16) {
    return NextResponse.json(
      { error: "Not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const header = request.headers.get("authorization");
  const provided = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!safeEqual(provided, expected)) {
    // Deliberately no detail: an unauthorised caller learns nothing.
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  return null;
}
