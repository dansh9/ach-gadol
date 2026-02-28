import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/kb/search?q=query&limit=5
 * Placeholder: text search on kb_chunks. Will be replaced with vector search.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const rawLimit = parseInt(searchParams.get("limit") || "5", 10);
    const limit = Math.min(Math.max(isNaN(rawLimit) ? 5 : rawLimit, 1), 50);

    if (!query || query.length > 500) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    // Text search fallback — will be replaced with vector search in Phase 2
    const { data, error } = await supabase
      .from("kb_chunks")
      .select("id, chunk_text, chunk_index, kb_document_id, metadata")
      .textSearch("chunk_text", query, { type: "plain" })
      .limit(limit);

    if (error) {
      // Fallback to ilike if text search fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("kb_chunks")
        .select("id, chunk_text, chunk_index, kb_document_id, metadata")
        .ilike("chunk_text", `%${query}%`)
        .limit(limit);

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }

      return NextResponse.json({ chunks: fallbackData || [] });
    }

    return NextResponse.json({ chunks: data || [] });
  } catch (error) {
    console.error("KB search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
