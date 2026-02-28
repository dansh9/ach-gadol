import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runRagPipeline } from "@/lib/rag/pipeline";

// Allow up to 30s for the AI pipeline (embed + search + Claude streaming)
export const maxDuration = 30;

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
    const body = await request.json();
    const { sessionId, message, language = "he", channel = "website" } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
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

    // Store user message
    const { error: userMsgError } = await supabase
      .from("chat_messages")
      .insert({
        session_id: activeSessionId,
        role: "user",
        content: message.trim(),
      });

    if (userMsgError) {
      console.error("Failed to store user message:", userMsgError);
    }

    // Fetch conversation history for context
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("session_id", activeSessionId)
      .order("created_at", { ascending: true })
      .limit(10);

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

          // Store assistant message
          const { error: botMsgError } = await supabase
            .from("chat_messages")
            .insert({
              session_id: activeSessionId,
              role: "assistant",
              content: ragResult.reply,
              confidence: ragResult.confidence,
              sources: ragResult.sources,
            });

          if (botMsgError) {
            console.error("Failed to store assistant message:", botMsgError);
          }

          // Update session last activity
          await supabase
            .from("chat_sessions")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", activeSessionId);

          // If confidence is low, flag for human review
          if (ragResult.confidence < 0.5) {
            await supabase.from("approval_queue").insert({
              approval_type: "kb_update",
              risk_level: ragResult.confidence < 0.3 ? "red" : "yellow",
              ai_suggestion: { reply: ragResult.reply, question: message },
              ai_sources: ragResult.sources,
              status: "pending",
            });
          }
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
