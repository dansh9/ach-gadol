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
 * In-memory map: "telegram:12345" → sessionId
 * Provides per-user session isolation without requiring a DB column.
 * Cleared on cold start, which is fine — a new session will be created.
 */
const sessionMap = new Map<string, string>();

/**
 * Process an incoming message from any channel.
 * Creates/finds session, runs RAG, stores messages, returns response.
 */
export async function handleIncomingMessage(
  msg: IncomingMessage
): Promise<OutgoingMessage> {
  const supabase = createAdminClient();

  // Build a unique key per user per channel
  const sessionKey = `${msg.channel}:${msg.externalId}`;
  let sessionId: string = sessionMap.get(sessionKey) || "";

  // Verify the cached session is still active
  if (sessionId) {
    const { data: check } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("status", "active")
      .maybeSingle();

    if (!check) {
      sessionMap.delete(sessionKey);
      sessionId = "";
    }
  }

  // Create new session if none found
  if (!sessionId) {
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
      console.error("Failed to create chat session:", error);
      throw new Error("Failed to create chat session");
    }
    sessionId = newSession.id;
    sessionMap.set(sessionKey, sessionId);
  }

  // Fetch the PREVIOUS messages before storing the new one, so the current
  // message is not in the history (buildMessages appends it once). Newest 10,
  // reversed into chronological order — ascending + limit returned the first
  // 10 messages of the session instead of the most recent.
  const { data: recentDesc } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(10);
  const history = (recentDesc || []).reverse();

  // Store user message
  await supabase.from("chat_messages").insert({
    session_id: sessionId,
    role: "user",
    content: msg.text,
  });

  const conversationHistory = history
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

  // Store assistant response. A service-error reply is shown to the user but
  // never stored: otherwise the model reads "Service is temporarily
  // unavailable" as its own previous answer on the next message.
  if (!ragResult.isError) {
    const { error: storeError } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: ragResult.reply,
      confidence: ragResult.confidence,
      sources: ragResult.sources,
    });
    if (storeError) {
      console.error("[handler] storing assistant message failed:", storeError.message);
    }
  }

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

/**
 * End the active session for a given external user on a channel.
 * Used by /reset commands to start fresh.
 */
export async function endSession(
  channel: Channel,
  externalId: string
): Promise<void> {
  const sessionKey = `${channel}:${externalId}`;
  const sessionId = sessionMap.get(sessionKey);

  if (sessionId) {
    const supabase = createAdminClient();
    await supabase
      .from("chat_sessions")
      .update({ status: "closed" })
      .eq("id", sessionId)
      .eq("status", "active");

    sessionMap.delete(sessionKey);
  }
}
