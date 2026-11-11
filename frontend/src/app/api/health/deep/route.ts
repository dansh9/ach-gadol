import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/security";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/* AG-SEC-06: full diagnostics, admin-only.
 *
 * The previous public /api/health ran real OpenAI and Anthropic requests on
 * every anonymous GET — so any visitor could run up provider charges — and
 * disclosed which secrets were configured, upstream error bodies, available
 * model lists and the Telegram webhook configuration.
 */

const MODELS_IN_USE = [
  {
    id: process.env.ANTHROPIC_ANSWER_MODEL || "claude-sonnet-5-5",
    used_at: "pipeline.ts ANSWER_MODEL (main answer generation)",
  },
  {
    id: process.env.ANTHROPIC_REPAIR_MODEL || "claude-haiku-5-5",
    used_at: "pipeline.ts REPAIR_MODEL (follow-up repair pass)",
  },
];

function redact(input: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  let out = input;
  if (token) out = out.split(token).join("<REDACTED>");
  return out.replace(/\b\d{6,12}:[A-Za-z0-9_-]{30,}\b/g, "<REDACTED>");
}

async function testModel(id: string): Promise<string> {
  const t0 = Date.now();
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: id,
        max_tokens: 5,
        messages: [{ role: "user", content: "hi" }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (resp.ok) return `OK (${Date.now() - t0}ms)`;
    return `FAIL ${resp.status}: ${(await resp.text()).slice(0, 300)}`;
  } catch (e: unknown) {
    return `CRASH: ${e instanceof Error ? e.message : String(e)}`;
  }
}

export async function GET(request: NextRequest) {
  // Authorization: Bearer <ADMIN_API_KEY>. A query parameter was avoided on
  // purpose: URLs end up in proxy logs, referrers and browser history.
  const denied = requireAdmin(request);
  if (denied) return denied;

  const out: Record<string, unknown> = {};
  const start = Date.now();

  out.env = {
    anthropic_key: process.env.ANTHROPIC_API_KEY ? "set" : "MISSING",
    openai_key: process.env.OPENAI_API_KEY ? "set" : "MISSING",
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING",
    supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "MISSING",
    telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN ? "set" : "MISSING",
    telegram_webhook_secret: process.env.TELEGRAM_WEBHOOK_SECRET ? "set" : "MISSING",
    whatsapp_app_secret: process.env.WHATSAPP_APP_SECRET ? "set" : "not set",
    session_secret: process.env.SESSION_SECRET ? "set" : "falling back to service-role key",
  };

  try {
    const t0 = Date.now();
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("kb_chunks")
      .select("*", { count: "exact", head: true });
    const { count: docCount } = await supabase
      .from("kb_documents")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);
    out.supabase = error
      ? `ERROR: ${error.message}`
      : `OK (${count} chunks, ${docCount} active documents, ${Date.now() - t0}ms)`;
  } catch (e: unknown) {
    out.supabase = `CRASH: ${e instanceof Error ? e.message : String(e)}`;
  }

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
      signal: AbortSignal.timeout(10000),
    });
    out.openai_embeddings = resp.ok
      ? `OK (${Date.now() - t0}ms)`
      : `FAIL ${resp.status}: ${(await resp.text()).slice(0, 300)}`;
  } catch (e: unknown) {
    out.openai_embeddings = `CRASH: ${e instanceof Error ? e.message : String(e)}`;
  }

  const modelResults: Record<string, string> = {};
  for (const m of MODELS_IN_USE) {
    modelResults[`${m.id}  (${m.used_at})`] = await testModel(m.id);
  }
  out.anthropic_models_in_use = modelResults;

  if (process.env.TELEGRAM_BOT_TOKEN) {
    const base = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
    try {
      const wh = await fetch(`${base}/getWebhookInfo`, {
        signal: AbortSignal.timeout(10000),
      });
      out.telegram_webhook = JSON.parse(redact(await wh.text()));
    } catch (e: unknown) {
      out.telegram_webhook = `CRASH: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else {
    out.telegram_webhook = "TELEGRAM_BOT_TOKEN missing";
  }

  out.total_time = `${Date.now() - start}ms`;

  return NextResponse.json(out, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
