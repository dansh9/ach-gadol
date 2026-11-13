/**
 * RAG Pipeline: embed query → vector search → build prompt → Claude → parse response
 * Always uses the real model pipeline. No demo/fallback mode.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding } from "./embeddings";
import { buildSystemPrompt, buildMessages } from "./prompts";
import { detectLanguage } from "./language";

/* ===== Models =====
 * Defined in one place and overridable by env, so a model retirement becomes a
 * config change rather than a code change. The previous hard-coded IDs
 * (claude-sonnet-4-20250514, claude-3-5-haiku-20241022) were retired by
 * Anthropic during 2026 and started returning 404 not_found_error, which took
 * the assistant down on both the website and Telegram.
 * Check availability with: GET https://api.anthropic.com/v1/models
 */
const ANSWER_MODEL = process.env.ANTHROPIC_ANSWER_MODEL || "claude-sonnet-5-5";
const REPAIR_MODEL = process.env.ANTHROPIC_REPAIR_MODEL || "claude-haiku-5-5";

/**
 * Collect every text block of a non-streaming response.
 *
 * Current Claude models run adaptive thinking by default, so the first content
 * block is a thinking block and the answer sits in a later block. Reading
 * content[0] alone returned "" for every Telegram and WhatsApp message while
 * the website (streaming path) kept working.
 */
function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export interface RagResult {
  reply: string;
  sources: string[];
  sourceMap: Record<string, { title: string; url?: string }>;
  confidence: number;
  language: string;
  /**
   * True when `reply` is the service-unavailable message rather than an answer.
   * Callers must not store it as the assistant's turn: on the next message the
   * model would read "Service is temporarily unavailable" as its own previous
   * answer and continue from there.
   */
  isError?: boolean;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/* ===== KB Chunk Cache (avoids repeated Supabase fetches on warm instances) ===== */

interface CachedChunk {
  chunk_text: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  document_title: string;
  source_url: string;
}

let _chunkCache: CachedChunk[] | null = null;
let _chunkCacheTime = 0;
const CHUNK_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedKBChunks(): Promise<CachedChunk[]> {
  if (_chunkCache && Date.now() - _chunkCacheTime < CHUNK_CACHE_TTL) {
    console.log("[RAG] KB cache hit");
    return _chunkCache;
  }

  console.log("[RAG] KB cache miss — fetching from Supabase...");
  const fetchStart = Date.now();

  try {
    const supabase = createAdminClient();

    // Race against a 12-second timeout to prevent cold-start hangs
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("KB fetch timeout (12s)")), 12_000)
    );

    const [chunksResult, docsResult] = (await Promise.race([
      Promise.all([
        supabase
          .from("kb_chunks")
          .select("chunk_text, kb_document_id, embedding, metadata")
          .not("embedding", "is", null),
        // AG-SEC-05: only published documents may reach public chat context.
        supabase
          .from("kb_documents")
          .select("id, title, source_url")
          .eq("is_active", true),
      ]),
      timeoutPromise,
    ])) as unknown as [{ data: Array<{ chunk_text: string; kb_document_id: string; embedding: string | number[]; metadata: Record<string, unknown> }> | null }, { data: Array<{ id: string; title: string; source_url?: string }> | null }];

    const chunksData = chunksResult.data;
    const docsData = docsResult.data;
    console.log(`[RAG] KB fetch done: ${Date.now() - fetchStart}ms, ${chunksData?.length ?? 0} chunks`);

    if (!chunksData || chunksData.length === 0) return [];

    const docMap: Record<string, { title: string; source_url: string }> = {};
    if (docsData) {
      docsData.forEach((d) => {
        docMap[d.id] = { title: d.title, source_url: d.source_url || "" };
      });
    }

    // Parse string embeddings once and cache the result (with try-catch for safety)
    _chunkCache = chunksData
      .map((chunk) => {
        try {
          // AG-SEC-05: a chunk whose document is inactive/withdrawn is dropped
          // here rather than relying on prompt instructions to ignore it.
          if (!docMap[chunk.kb_document_id]) return null;
          return {
            chunk_text: chunk.chunk_text,
            metadata: chunk.metadata || {},
            embedding:
              typeof chunk.embedding === "string"
                ? (JSON.parse(chunk.embedding) as number[])
                : chunk.embedding,
            document_title: docMap[chunk.kb_document_id]!.title,
            source_url: docMap[chunk.kb_document_id]!.source_url,
          };
        } catch {
          return null;
        }
      })
      .filter((chunk): chunk is CachedChunk => chunk !== null && chunk.embedding.length > 0);
    _chunkCacheTime = Date.now();

    return _chunkCache;
  } catch (err) {
    console.warn(`[RAG] KB fetch failed (${Date.now() - fetchStart}ms):`, err);
    return [];
  }
}

/* Fallback source URLs for KB documents that don't have source_url populated */
const KB_SOURCE_URLS: Record<string, string> = {
  "Lone Soldier Rights Overview":
    "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C%D7%99-%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%99%D7%99%D7%97%D7%95%D7%93%D7%99%D7%99%D7%9D/%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/",
  "How to Apply for Rent Assistance":
    "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9E%D7%A1%D7%9C%D7%95%D7%9C%D7%99-%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%99%D7%99%D7%97%D7%95%D7%93%D7%99%D7%99%D7%9D/%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D-%D7%91%D7%95%D7%93%D7%93%D7%99%D7%9D/%D7%94%D7%98%D7%91%D7%95%D7%AA-%D7%93%D7%99%D7%95%D7%A8/",
  "Discharge and Post-Service Benefits":
    "https://www.idf.il/%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA-%D7%A9%D7%9C%D7%99/%D7%9C%D7%90-%D7%9E%D7%A4%D7%95%D7%91%D7%9C%D7%A9/%D7%90%D7%99%D7%92%D7%A8%D7%AA-%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA-%D7%9C%D7%97%D7%99%D7%99%D7%9C-%D7%94%D7%91%D7%95%D7%93%D7%93-%D7%94%D7%9E%D7%A9%D7%AA%D7%97%D7%A8%D7%A8/",
};

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Build a safe error response with volunteer escalation info.
 * Used when the API key is missing or the Claude call fails.
 */
function buildErrorResult(
  language: string,
  errorId: string,
  onToken?: (token: string) => void
): RagResult {
  const reply =
    language === "he"
      ? `השירות אינו זמין כרגע. אנא נסו שוב מאוחר יותר.\n\nלעזרה מיידית, פנו למתנדב אח גדול:\n- וואטסאפ: 058-785-0457\n- מייל: info@achgadol.org\n\n(קוד: ${errorId})`
      : `Service is temporarily unavailable. Please try again later.\n\nFor immediate help, contact an Ach Gadol volunteer:\n- WhatsApp: +972-58-785-0457\n- Email: info@achgadol.org\n\n(ref: ${errorId})`;
  if (onToken) onToken(reply);
  return {
    reply,
    sources: [],
    sourceMap: {},
    confidence: 0,
    language,
    isError: true,
  };
}

/**
 * Run the full RAG pipeline for a chat message.
 * Always uses the real model pipeline. On failure, returns a safe error
 * message with volunteer escalation info — never fake/demo responses.
 */
export async function runRagPipeline(
  message: string,
  conversationHistory: ConversationMessage[] = [],
  preferredLanguage?: string,
  onToken?: (token: string) => void
): Promise<RagResult> {
  const pipelineStart = Date.now();
  const timelog = (step: string) => console.log(`[RAG] ${step}: ${Date.now() - pipelineStart}ms`);

  // 1. Detect language
  const language = preferredLanguage || detectLanguage(message);

  // 2. Require Anthropic key
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    const errorId = `ERR-${Date.now().toString(36)}`;
    console.error(`[${errorId}] ANTHROPIC_API_KEY is not configured`);
    return buildErrorResult(language, errorId, onToken);
  }

  // 3. Search KB using multilingual embeddings
  //    text-embedding-3-small is multilingual — use lower threshold for non-English
  const matchThreshold = language === "en" ? 0.3 : 0.2;

  // 4. Generate embedding AND fetch cached KB chunks IN PARALLEL
  let kbChunks: {
    chunk_text: string;
    metadata?: Record<string, unknown>;
    document_title?: string;
    source_url?: string;
  }[] = [];

  try {
    const [embedding, allCachedChunks] = await Promise.all([
      generateEmbedding(message),
      getCachedKBChunks(),
    ]);
    timelog("embedding+KB done");

    // Compute cosine similarity (fast, in-memory with pre-parsed embeddings)
    const scored = allCachedChunks
      .map((chunk) => ({
        chunk_text: chunk.chunk_text,
        metadata: chunk.metadata,
        document_title: chunk.document_title,
        source_url: chunk.source_url,
        similarity: cosineSimilarity(embedding, chunk.embedding),
      }))
      .filter((c) => c.similarity > matchThreshold)
      .sort((a, b) => b.similarity - a.similarity);

    // Deduplicate: keep only the highest-scoring chunk per document
    const seenDocs = new Set<string>();
    const deduplicated = scored.filter((c) => {
      const key = c.document_title || c.chunk_text.slice(0, 50);
      if (seenDocs.has(key)) return false;
      seenDocs.add(key);
      return true;
    }).slice(0, 5);

    kbChunks = deduplicated.map((s) => ({
      chunk_text: s.chunk_text,
      metadata: s.metadata,
      document_title: s.document_title,
      source_url: s.source_url,
    }));
  } catch (embeddingError) {
    // If embedding fails (no OpenAI key), continue without KB context
    console.warn("Embedding/search failed, continuing without KB:", embeddingError);
  }

  // 5. Build source map for citation links (includes external source URLs)
  const sourceMap: Record<string, { title: string; url?: string }> = {};
  kbChunks.forEach((chunk, i) => {
    const title = chunk.document_title || `Source ${i + 1}`;
    const url = chunk.source_url || KB_SOURCE_URLS[title] || "";
    sourceMap[String(i + 1)] = {
      title,
      ...(url ? { url } : {}),
    };
  });

  // 6. Build system prompt with KB context
  const systemPrompt = buildSystemPrompt(language, kbChunks);

  // 7. Build conversation messages
  const messages = buildMessages(conversationHistory, message);

  // 8. Call Claude (streaming or non-streaming)
  try {
    /* The SDK default is a 10-minute timeout with 2 retries, which outlives the
     * route's maxDuration of 60s: a stalled call never throws, the fallback
     * reply below is never reached, and Vercel kills the function with nothing
     * logged — the user just gets silence. Bound it so a stall becomes a caught
     * error with time left to answer. Worst case here is 2 x 20s, and the
     * repair pass is already skipped once the pipeline passes 40s. For scale,
     * a healthy answer call returns in about 1.5s. */
    const anthropic = new Anthropic({
      apiKey: anthropicKey,
      timeout: 20_000,
      maxRetries: 1,
    });

    let rawReply = "";

    timelog(
      `Claude call start (mode=${onToken ? "stream" : "create"}, model=${ANSWER_MODEL}, system=${systemPrompt.length}ch, messages=${messages.length})`
    );

    if (onToken) {
      // Streaming mode — buffer to filter out [[CONFIDENCE:X.XX]] marker
      // The marker appears at the end of the response, so we buffer trailing
      // text that might be part of it and only flush confirmed-safe text.
      let buffer = "";

      const flushSafe = () => {
        // Check if buffer might contain the start of a confidence marker
        const markerStart = buffer.indexOf("[[");
        if (markerStart === -1) {
          // No potential marker — flush everything
          if (buffer.length > 0) {
            onToken(buffer);
            buffer = "";
          }
        } else if (markerStart > 0) {
          // Flush text before the potential marker
          onToken(buffer.slice(0, markerStart));
          buffer = buffer.slice(markerStart);
        }
        // else: buffer starts with "[["" — hold it until we know more
      };

      const stream = anthropic.messages.stream({
        model: ANSWER_MODEL,
        max_tokens: 2048,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        messages,
      });

      stream.on("text", (text) => {
        rawReply += text;
        buffer += text;

        // If buffer contains a complete confidence marker, strip it
        const markerMatch = buffer.match(/\[\[CONFIDENCE:[\d. ]+\]\]/);
        if (markerMatch) {
          buffer = buffer.replace(/\[\[CONFIDENCE:[\d. ]+\]\]/, "");
        }

        // If buffer is long enough that it's not a partial marker, flush
        // The longest marker is "[[CONFIDENCE:0.XX]]" = 20 chars
        if (!buffer.includes("[[") || buffer.length > 25) {
          flushSafe();
        }
      });

      await stream.finalMessage();
      timelog("Claude stream done");

      // Flush any remaining buffer (strip confidence marker if present)
      buffer = buffer.replace(/\[\[CONFIDENCE:[\d. ]+\]\]/, "");
      if (buffer.trim().length > 0) {
        onToken(buffer);
      }
    } else {
      // Non-streaming mode (Telegram / WhatsApp)
      const response = await anthropic.messages.create({
        model: ANSWER_MODEL,
        max_tokens: 2048,
        system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
        messages,
      });
      timelog(
        `Claude create done (blocks=${response.content.map((b) => b.type).join(",")}, stop=${response.stop_reason})`
      );
      rawReply = extractText(response.content);

      if (!rawReply.trim()) {
        const errorId = `ERR-${Date.now().toString(36)}`;
        console.error(
          `[${errorId}] Claude returned no text (blocks=${response.content
            .map((b) => b.type)
            .join(",")}, stop=${response.stop_reason})`
        );
        return buildErrorResult(language, errorId, onToken);
      }
    }

    // 9. Parse response — confidence marker
    const confidenceMatch = rawReply.match(/\[\[CONFIDENCE:([\d. ]+)\]\]/);
    const rawConfidence = confidenceMatch
      ? parseFloat(confidenceMatch[1].trim())
      : 0.5;

    // 10. Detect citations — multiple formats
    const hasNumberedCitations = /\[\d+\]/.test(rawReply);
    const hasMarkdownLinks = /\[.+?\]\(https?:\/\/.+?\)/.test(rawReply);
    const hasSourcesSection = /(?:מקורות|sources)\s*:?\s*\n/i.test(rawReply);
    const hasCitations = hasNumberedCitations || hasMarkdownLinks || hasSourcesSection;

    // Detect explicit "no source" refusals — don't boost these
    const isRefusal = /לא מצאתי מקור|no reliable source|couldn't find/i.test(rawReply);

    // Boost confidence only when citations exist AND answer isn't a refusal
    const confidence =
      kbChunks.length > 0 && hasCitations && !isRefusal
        ? Math.max(rawConfidence, 0.7)
        : rawConfidence;

    // 11. Remove confidence marker from the visible reply
    let cleanReply = rawReply.replace(/\[\[CONFIDENCE:[\d. ]+\]\]/, "").trim();

    // 12. Repair pass — add missing follow-ups if absent
    //     Uses Haiku for speed; skipped if pipeline already took > 40s
    const hasFollowUps = /^>> /m.test(cleanReply);
    const elapsed = Date.now() - pipelineStart;
    if (!hasFollowUps && elapsed < 40_000) {
      try {
        timelog("repair pass start");
        const repairResponse = await anthropic.messages.create({
          model: REPAIR_MODEL,
          max_tokens: 256,
          system: `You are a formatting repair tool. The following chatbot response is missing 2–3 follow-up suggestions. Output ONLY 2-3 lines starting with ">> ". Use the same language as the original response.`,
          messages: [{ role: "user", content: cleanReply.slice(0, 500) }],
        });
        const repairText = extractText(repairResponse.content).trim();

        const followUpLines = repairText
          .split("\n")
          .filter((line: string) => line.startsWith(">> "))
          .slice(0, 3);
        if (followUpLines.length > 0) {
          cleanReply = cleanReply + "\n\n" + followUpLines.join("\n");
        }
        timelog("repair pass done");
      } catch (repairError) {
        // Repair is best-effort — never block the main response
        console.warn("Repair pass failed (non-critical):", repairError);
      }
    } else if (!hasFollowUps) {
      timelog("repair pass SKIPPED (elapsed > 40s)");
    }

    // 13. Extract source references from numbered citations
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

    timelog("pipeline complete");
    return {
      reply: cleanReply,
      sources,
      sourceMap,
      confidence,
      language,
    };
  } catch (claudeError: unknown) {
    const errorId = `ERR-${Date.now().toString(36)}`;
    const errMsg = claudeError instanceof Error ? claudeError.message : String(claudeError);
    const statusCode = (claudeError as { status?: number })?.status;
    console.error(`[${errorId}] Claude API call failed (status=${statusCode}): ${errMsg}`);

    // Surface billing / auth errors clearly in the logs
    if (statusCode === 401) {
      console.error(`[${errorId}] ⚠️  ANTHROPIC_API_KEY is invalid or expired`);
    } else if (statusCode === 429 || errMsg.includes("budget") || errMsg.includes("rate")) {
      console.error(`[${errorId}] ⚠️  API rate limit or budget exhausted`);
    }

    return buildErrorResult(language, errorId, onToken);
  }
}
