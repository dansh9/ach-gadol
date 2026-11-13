import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { runRagPipeline } from "@/lib/rag/pipeline";

/* ===== Session ownership (AG-SEC-02) =====
 * The conversation id is NEVER taken from the request body: anyone who learned
 * another visitor's UUID could otherwise read that conversation (its history is
 * fed into the model context) and append messages to it.
 * Instead the server issues an HttpOnly cookie holding "<uuid>.<hmac>". Only a
 * value this server signed is accepted, so a client cannot name someone else's
 * session.
 */
const SESSION_COOKIE = "ag_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sessionSecret(): string {
  // SESSION_SECRET is preferred; the service-role key is always present
  // server-side and never leaves it, so it is a safe fallback.
  return process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

function signSession(id: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(id).digest("base64url");
}

function buildSessionCookie(id: string): string {
  return [
    `${SESSION_COOKIE}=${id}.${signSession(id)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE}`,
  ].join("; ");
}

/** Returns the session id only if this server signed it. */
function readSessionCookie(request: NextRequest): string | null {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = raw.slice(0, dot);
  const mac = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(signSession(id));
  if (mac.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(mac, expected)) return null;
  return id;
}

const ALLOWED_CHANNELS = new Set(["website"]);
const ALLOWED_LANGUAGES = new Set(["he", "en", "ru", "am", "fr", "es", "ar"]);

// Allow up to 60s for the AI pipeline (embed + search + Claude streaming + repair pass)
export const maxDuration = 60;

/* ---------- Rate Limiter (in-memory, per IP) ---------- */
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 15;     // max 15 requests per minute per IP

const ipHits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  pruneHits(now);
  const entry = ipHits.get(ip);

  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}

// NOTE: this limiter is per serverless instance, so it bounds a single
// instance rather than the deployment. A distributed limiter is still needed
// for real abuse protection (AG-SEC-08).
// Entries are pruned opportunistically; a module-scope setInterval never fires
// reliably in a serverless runtime.
function pruneHits(now: number): void {
  if (ipHits.size < 5000) return;
  ipHits.forEach((entry, ip) => {
    if (now > entry.resetAt) ipHits.delete(ip);
  });
}

/**
 * POST /api/chat/send
 * Body: { sessionId?: string, message: string, language?: string, channel?: string }
 * Returns: SSE stream with events:
 *   { type: "session", sessionId }
 *   { type: "token", text }
 *   { type: "done", sources, sourceMap, confidence }
 *   { type: "error", message }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, reset } = body;
    const language = ALLOWED_LANGUAGES.has(body.language) ? body.language : "he";
    const channel = ALLOWED_CHANNELS.has(body.channel) ? body.channel : "website";

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Prevent abuse: limit message length
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // AG-SEC-02: ownership comes from the signed cookie, never from the body.
    // `reset: true` deliberately abandons the current session and starts a new one.
    let resolvedSessionId: string | null =
      reset === true ? null : readSessionCookie(request);
    let issuedNewSession = false;

    if (resolvedSessionId) {
      // The cookie is authentic, but the row may have been deleted since.
      const { data: existing } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("id", resolvedSessionId)
        .maybeSingle();
      if (!existing) resolvedSessionId = null;
    }

    if (!resolvedSessionId) {
      const { data: session, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          channel,
          language,
          status: "active",
        })
        .select("id")
        .single();

      if (sessionError) {
        console.error("Failed to create chat session:", sessionError);
        return NextResponse.json(
          { error: "Failed to create chat session" },
          { status: 500 }
        );
      }
      resolvedSessionId = session.id as string;
      issuedNewSession = true;
    }

    // Definitely a string from here on — keeps the rest of the handler simple.
    const activeSessionId: string = resolvedSessionId;

    // Fetch the PREVIOUS messages first, then store the new one.
    // - Newest 10, reversed back into chronological order. Ordering ascending
    //   with a limit returned the *first* 10 messages of the session, so after
    //   five exchanges the model lost the recent conversation.
    // - Fetching before inserting keeps the current message out of the
    //   history; buildMessages() appends it exactly once. Running both in
    //   parallel made duplication a race.
    const { data: recentDesc } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", activeSessionId)
      .order("created_at", { ascending: false })
      .limit(10);
    const history = (recentDesc || []).reverse();

    const storeResult = await supabase.from("chat_messages").insert({
      session_id: activeSessionId,
      role: "user",
      content: message.trim(),
    });

    if (storeResult.error) {
      console.error("Failed to store user message:", storeResult.error);
    }

    const conversationHistory = history
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Create SSE streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        // Send session ID immediately
        send({ type: "session", sessionId: activeSessionId });

        try {
          // Run RAG pipeline with streaming token callback
          const ragResult = await runRagPipeline(
            message.trim(),
            conversationHistory,
            language,
            (token) => send({ type: "token", text: token })
          );

          // Send final metadata
          send({
            type: "done",
            sources: ragResult.sources,
            sourceMap: ragResult.sourceMap,
            confidence: ragResult.confidence,
          });

          // Store assistant message + update session IN PARALLEL (non-blocking)
          const storeBotMsg = supabase
            .from("chat_messages")
            .insert({
              session_id: activeSessionId,
              role: "assistant",
              content: ragResult.reply,
              confidence: ragResult.confidence,
              sources: ragResult.sources,
            });

          const updateSession = supabase
            .from("chat_sessions")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", activeSessionId);

          await Promise.all([storeBotMsg, updateSession]);
        } catch (error) {
          console.error("Streaming pipeline error:", error);
          send({ type: "error", message: "Internal server error" });
        }

        controller.close();
      },
    });

    const responseHeaders: Record<string, string> = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    };
    if (issuedNewSession) {
      responseHeaders["Set-Cookie"] = buildSessionCookie(activeSessionId);
    }

    return new Response(stream, { headers: responseHeaders });
  } catch (error) {
    console.error("Chat send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
