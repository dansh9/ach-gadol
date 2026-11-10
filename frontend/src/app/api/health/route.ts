import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Models the pipeline actually calls — kept in sync with pipeline.ts */
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

/** Remove anything that looks like a bot token from a string */
function redact(input: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  let out = input;
  if (token) out = out.split(token).join("<REDACTED>");
  // generic telegram token shape: 123456789:AAE...
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
    const body = (await resp.text()).slice(0, 300);
    return `FAIL ${resp.status}: ${body}`;
  } catch (e: unknown) {
    return `CRASH: ${e instanceof Error ? e.message : String(e)}`;
  }
}

export async function GET() {
  const out: Record<string, unknown> = {};
  const start = Date.now();

  /* ---------- 1. Env ---------- */
  out.env = {
    anthropic_key: process.env.ANTHROPIC_API_KEY ? "set" : "MISSING",
    openai_key: process.env.OPENAI_API_KEY ? "set" : "MISSING",
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING",
    supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "MISSING",
    telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN ? "set" : "MISSING",
    telegram_webhook_secret: process.env.TELEGRAM_WEBHOOK_SECRET ? "set" : "not set",
  };

  /* ---------- 2. Supabase ---------- */
  try {
    const t0 = Date.now();
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("kb_chunks")
      .select("*", { count: "exact", head: true });
    const { count: docCount } = await supabase
      .from("kb_documents")
      .select("*", { count: "exact", head: true });
    out.supabase = error
      ? `ERROR: ${error.message}`
      : `OK (${count} chunks, ${docCount} documents, ${Date.now() - t0}ms)`;
  } catch (e: unknown) {
    out.supabase = `CRASH: ${e instanceof Error ? e.message : String(e)}`;
  }

  /* ---------- 3. OpenAI embeddings ---------- */
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

  /* ---------- 4. Which Anthropic models does THIS key actually have? ---------- */
  try {
    const resp = await fetch("https://api.anthropic.com/v1/models?limit=100", {
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (resp.ok) {
      const json = await resp.json();
      out.anthropic_models_available = (json.data || []).map(
        (m: { id: string }) => m.id
      );
    } else {
      out.anthropic_models_available = `FAIL ${resp.status}: ${(await resp.text()).slice(0, 300)}`;
    }
  } catch (e: unknown) {
    out.anthropic_models_available = `CRASH: ${e instanceof Error ? e.message : String(e)}`;
  }

  /* ---------- 5. Test every model the code actually calls ---------- */
  const modelResults: Record<string, string> = {};
  for (const m of MODELS_IN_USE) {
    modelResults[`${m.id}  (${m.used_at})`] = await testModel(m.id);
  }
  out.anthropic_models_in_use = modelResults;

  /* ---------- 6. Telegram ---------- */
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const base = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
    try {
      const me = await fetch(`${base}/getMe`, { signal: AbortSignal.timeout(10000) });
      out.telegram_getMe = JSON.parse(redact(await me.text()));
    } catch (e: unknown) {
      out.telegram_getMe = `CRASH: ${e instanceof Error ? e.message : String(e)}`;
    }
    try {
      const wh = await fetch(`${base}/getWebhookInfo`, { signal: AbortSignal.timeout(10000) });
      out.telegram_webhook = JSON.parse(redact(await wh.text()));
    } catch (e: unknown) {
      out.telegram_webhook = `CRASH: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else {
    out.telegram_getMe = "TELEGRAM_BOT_TOKEN missing";
    out.telegram_webhook = "TELEGRAM_BOT_TOKEN missing";
  }

  out.deployment_url = process.env.VERCEL_URL || "unknown";
  out.total_time = `${Date.now() - start}ms`;

  return NextResponse.json(out, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
