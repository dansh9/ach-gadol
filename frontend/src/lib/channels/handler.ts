/**
 * Channel-agnostic message handler.
 * Routes messages from any channel (web, WhatsApp, Telegram) through the RAG pipeline.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { runRagPipeline } from "@/lib/rag/pipeline";

type Channel = "website" | "whatsapp" | "telegram";

interface IncomingMessage {
  externalId: string; // platform-specific user/chat ID
  text: string;
  channel: Channel;
  language?: string;
}

interface OutgoingMessage {
  text: string;
  sources: string[];
  confidence: number;
  sessionId: string;
}

/**
 * Process an incoming message from any channel.
 * Creates/finds session, runs RAG, stores messages, returns response.
 */
export async function handleIncomingMessage(
  msg: IncomingMessage
): Promise<OutgoingMessage> {
  const supabase = createAdminClient();

  // Find or create session for this external user
  let sessionId: string;

  const { data: existingSession } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("channel", msg.channel)
    .eq("language", msg.language || "he")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingSession) {
    sessionId = existingSession.id;
  } else {
    const { data: newSession, error } = await supabase
      .from("chat_sessions")
      .insert({
        channel: msg.channel,
        language: msg.language || "he",
        status: "active",
      })
      .select("id")
      .single();

    if (error || !newSession) {
      throw new Error("Failed to create chat session");
    }
    sessionId = newSession.id;
  }

  // Store user message
  await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role: "user",
    content: msg.text,
  });

  // Fetch conversation history
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(10);

  const conversationHistory = (history || [])
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // Run RAG pipeline
  const ragResult = await runRagPipeline(
    msg.text,
    conversationHistory,
    msg.language
  );

  // Store assistant response
  await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role: "assistant",
    content: ragResult.reply,
    confidence: ragResult.confidence,
    sources: ragResult.sources,
  });

  // Update session timestamp
  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  return {
    text: ragResult.reply,
    sources: ragResult.sources,
    confidence: ragResult.confidence,
    sessionId,
  };
}
