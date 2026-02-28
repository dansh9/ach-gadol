import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbeddings } from "@/lib/rag/embeddings";

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

/**
 * POST /api/kb/embed
 * One-time utility to embed all KB chunks that don't have embeddings yet.
 * Requires OPENAI_API_KEY and admin authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Admin authentication required — this endpoint costs money (OpenAI API)
    const authHeader = request.headers.get("authorization");
    const providedKey = authHeader?.replace("Bearer ", "");

    if (!ADMIN_API_KEY || providedKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized — admin API key required" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Fetch chunks without embeddings
    const { data: chunks, error } = await supabase
      .from("kb_chunks")
      .select("id, chunk_text")
      .is("embedding", null)
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        message: "No chunks need embedding",
        embedded: 0,
      });
    }

    // Generate embeddings in batches of 20
    const BATCH_SIZE = 20;
    let totalEmbedded = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const texts = batch.map((c) => c.chunk_text);

      const embeddings = await generateEmbeddings(texts);

      // Update each chunk with its embedding
      for (let j = 0; j < batch.length; j++) {
        const { error: updateError } = await supabase
          .from("kb_chunks")
          .update({ embedding: embeddings[j] as unknown as string })
          .eq("id", batch[j].id);

        if (updateError) {
          console.error(`Failed to update chunk ${batch[j].id}:`, updateError);
        } else {
          totalEmbedded++;
        }
      }
    }

    return NextResponse.json({
      message: `Embedded ${totalEmbedded} chunks`,
      embedded: totalEmbedded,
      total: chunks.length,
    });
  } catch (error) {
    console.error("KB embed error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
