-- =============================================================================
-- Ach Gadol - Complete Database Setup
-- Run this ONCE in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/<PROJECT_REF>/sql/new
-- =============================================================================

-- ======================== STEP 1: SCHEMA ========================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- KNOWLEDGE BASE DOCUMENTS
CREATE TABLE IF NOT EXISTS kb_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    source_url VARCHAR(1000),
    source_name VARCHAR(200),
    content TEXT NOT NULL,
    content_html TEXT,
    language VARCHAR(5) DEFAULT 'he',
    tags JSONB DEFAULT '[]',
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KB CHUNKS (for vector search)
CREATE TABLE IF NOT EXISTS kb_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kb_document_id UUID REFERENCES kb_documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INT,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IVFFlat index for vector search
DO $$
BEGIN
    CREATE INDEX idx_kb_chunks_embedding ON kb_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Vector index creation skipped (will be created when data is added)';
END $$;

-- CHAT SESSIONS
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel VARCHAR(20) CHECK (channel IN ('website', 'whatsapp', 'telegram', 'facebook', 'other')),
    language VARCHAR(5) DEFAULT 'he',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'escalated', 'closed')),
    satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system', 'volunteer')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    suggested_actions JSONB DEFAULT '[]',
    confidence DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_document ON kb_chunks(kb_document_id);

-- ======================== STEP 2: VECTOR SEARCH FUNCTION ========================

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

-- ======================== STEP 3: ROW LEVEL SECURITY ========================

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;

-- Chat tables: no anon policies = blocked (accessed via service_role only)

-- Knowledge base: allow anon read-only
CREATE POLICY "anon_read_kb_documents" ON kb_documents
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "anon_read_kb_chunks" ON kb_chunks
  FOR SELECT TO anon USING (true);

-- ======================== DONE ========================
SELECT 'Database setup complete! 4 tables, vector search function, and RLS policies created.' AS status;
