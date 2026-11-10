import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/health
 * Quick diagnostic endpoint — tests Supabase, OpenAI, and Anthropic connectivity.
 */
export async function GET() {
  const results: Record<string, string> = {};
  const start = Date.now();

  // 1. Check env vars
  results.anthropic_key = process.env.ANTHROPIC_API_KEY ? "set" : "MISSING";
  results.openai_key = process.env.OPENAI_API_KEY ? "set" : "MISSING";
  results.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING";
  results.supabase_key = process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "MISSING";

  // 2. Test Supabase
  try {
    const t0 = Date.now();
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("kb_chunks")
      .select("*", { count: "exact", head: true });
    results.supabase = error
      ? `ERROR: ${error.message}`
      : `OK (${count} chunks, ${Date.now() - t0}ms)`;
  } catch (e: unknown) {
    results.supabase = `CRASH: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 3. Test OpenAI embedding
  try {
    const t0 = Date.now();
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: "test",
        dimensions: 1536,
      }),
      signal: AbortSignal.timeout(8000),
    });
    results.openai = resp.ok
      ? `OK (${Date.now() - t0}ms)`
      : `ERROR: ${resp.status} ${await resp.text()}`;
  } catch (e: unknown) {
    results.openai = `CRASH: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 4. Test Anthropic
  try {
    const t0 = Date.now();
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10,
        messages: [{ role: "user", content: "hi" }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    results.anthropic = resp.ok
      ? `OK (${Date.now() - t0}ms)`
      : `ERROR: ${resp.status} ${(await resp.text()).slice(0, 200)}`;
  } catch (e: unknown) {
    results.anthropic = `CRASH: ${e instanceof Error ? e.message : String(e)}`;
  }

  results.total_time = `${Date.now() - start}ms`;

  return NextResponse.json(results);
}
