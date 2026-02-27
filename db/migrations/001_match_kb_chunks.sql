-- pgvector cosine similarity search function
-- Run this in the Supabase SQL Editor after running schema.sql

CREATE OR REPLACE FUNCTION match_kb_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  chunk_index int,
  kb_document_id uuid,
  document_title text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.chunk_text,
    kc.chunk_index,
    kc.kb_document_id,
    kd.title AS document_title,
    1 - (kc.embedding <=> query_embedding) AS similarity,
    kc.metadata
  FROM kb_chunks kc
  JOIN kb_documents kd ON kd.id = kc.kb_document_id
  WHERE kd.is_active = true
    AND kc.embedding IS NOT NULL
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
