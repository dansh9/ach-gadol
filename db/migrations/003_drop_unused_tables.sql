-- ============================================================
-- Migration 003: Drop unused tables
-- ============================================================
-- The app only uses 4 tables: chat_sessions, chat_messages,
-- kb_chunks, kb_documents. All other tables were scaffolded
-- for future features but contain no real data and no code
-- references them.
--
-- CASCADE drops FK constraints from kept tables automatically.
-- ============================================================

-- 1. Tables that depend on other unused tables (drop first)
DROP TABLE IF EXISTS case_events CASCADE;
DROP TABLE IF EXISTS eligibility_results CASCADE;
DROP TABLE IF EXISTS soldier_profiles CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS approval_queue CASCADE;
DROP TABLE IF EXISTS cases CASCADE;

-- 2. Standalone unused tables
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS rights CASCADE;
DROP TABLE IF EXISTS rules CASCADE;
DROP TABLE IF EXISTS form_templates CASCADE;
DROP TABLE IF EXISTS translations CASCADE;
DROP TABLE IF EXISTS glossary CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;

-- 3. Enable RLS on the 4 remaining tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;

-- chat_sessions + chat_messages: block anon (accessed via service_role only)
-- kb_documents + kb_chunks: allow anon read (public knowledge base)
CREATE POLICY "anon_read_kb_documents" ON kb_documents
  FOR SELECT TO anon USING (is_active = true);

CREATE POLICY "anon_read_kb_chunks" ON kb_chunks
  FOR SELECT TO anon USING (true);
