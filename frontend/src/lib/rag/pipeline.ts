/**
 * RAG Pipeline: embed query → vector search → build prompt → Claude → parse response
 */

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding } from "./embeddings";
import { buildSystemPrompt, buildMessages } from "./prompts";
import { detectLanguage } from "./language";

export interface RagResult {
  reply: string;
  sources: string[];
  confidence: number;
  language: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Run the full RAG pipeline for a chat message.
 */
export async function runRagPipeline(
  message: string,
  conversationHistory: ConversationMessage[] = [],
  preferredLanguage?: string
): Promise<RagResult> {
  // 1. Detect language
  const language = preferredLanguage || detectLanguage(message);

  // 2. Generate embedding for the query
  let kbChunks: {
    chunk_text: string;
    metadata?: Record<string, unknown>;
    document_title?: string;
  }[] = [];

  try {
    const embedding = await generateEmbedding(message);

    // 3. Vector search for relevant KB chunks
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("match_kb_chunks", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 5,
    });

    if (!error && data) {
      kbChunks = data.map(
        (chunk: {
          chunk_text: string;
          metadata: Record<string, unknown>;
          document_title: string;
          similarity: number;
        }) => ({
          chunk_text: chunk.chunk_text,
          metadata: chunk.metadata,
          document_title: chunk.document_title,
        })
      );
    }
  } catch (embeddingError) {
    // If embedding fails (no OpenAI key), continue without KB context
    console.warn("Embedding/search failed, continuing without KB:", embeddingError);
  }

  // 4. Build system prompt with KB context
  const systemPrompt = buildSystemPrompt(language, kbChunks);

  // 5. Build conversation messages
  const messages = buildMessages(conversationHistory, message);

  // 6. Call Claude
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    // Return a helpful message if no API key configured
    return {
      reply:
        language === "he"
          ? "המערכת עדיין בשלב הגדרה. אנא פנה למתנדב לעזרה אישית."
          : "The system is still being configured. Please contact a volunteer for personal help.",
      sources: [],
      confidence: 0,
      language,
    };
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  // 7. Parse response
  const rawReply =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract confidence score from [[CONFIDENCE:X.XX]]
  const confidenceMatch = rawReply.match(/\[\[CONFIDENCE:([\d.]+)\]\]/);
  const confidence = confidenceMatch
    ? parseFloat(confidenceMatch[1])
    : 0.5;

  // Remove confidence marker from the visible reply
  const cleanReply = rawReply.replace(/\[\[CONFIDENCE:[\d.]+\]\]/, "").trim();

  // Extract source references
  const sourceRefs: number[] = [];
  const sourceRegex = /\[(\d+)\]/g;
  let sourceMatch: RegExpExecArray | null;
  while ((sourceMatch = sourceRegex.exec(cleanReply)) !== null) {
    sourceRefs.push(parseInt(sourceMatch[1]) - 1);
  }
  const sources = Array.from(new Set(sourceRefs))
    .filter((i) => i >= 0 && i < kbChunks.length)
    .map(
      (i) =>
        kbChunks[i].document_title ||
        `Source ${i + 1}`
    );

  return {
    reply: cleanReply,
    sources,
    confidence,
    language,
  };
}
