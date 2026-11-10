import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runRagPipeline } from "@/lib/rag/pipeline";

// Allow up to 60s for the AI pipeline (embed + search + Claude streaming + repair pass)
export const maxDuration = 60;

/* ---------- Rate Limiter (in-memory, per IP) ---------- */
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 15;     // max 15 requests per minute per IP

const ipHits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);

  if (!entry || now > entry.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  ipHits.forEach((entry, ip) => {
    if (now > entry.resetAt) ipHits.delete(ip);
  });
}, 5 * 60 * 1000);

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
    const { sessionId, message, language = "he", channel = "website" } = body;

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
    let activeSessionId = sessionId;

    // Create new session if none provided
    if (!activeSessionId) {
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
      activeSessionId = session.id;
    }

    // Store user message + fetch conversation history IN PARALLEL
    const [storeResult, { data: history }] = await Promise.all([
      supabase
        .from("chat_messages")
        .insert({
          session_id: activeSessionId,
          role: "user",
          content: message.trim(),
        }),
      supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: true })
        .limit(10),
    ]);

    if (storeResult.error) {
      console.error("Failed to store user message:", storeResult.error);
    }

    const conversationHistory = (history || [])
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

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
