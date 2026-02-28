-- =============================================================================
-- Ach Gadol - Complete Database Setup
-- Run this ONCE in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bbwbvpiagbiwlvxqqycb/sql/new
-- =============================================================================

-- ======================== STEP 1: SCHEMA ========================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('soldier', 'volunteer', 'admin', 'compliance_officer')),
    email VARCHAR(255),
    phone VARCHAR(20),
    full_name VARCHAR(255),
    preferred_language VARCHAR(5) DEFAULT 'he',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- SOLDIER PROFILES
CREATE TABLE IF NOT EXISTS soldier_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    soldier_type VARCHAR(30) CHECK (soldier_type IN (
        'lone_classic', 'child_of_emigrants', 'child_of_envoys',
        'no_family_support', 'orphan', 'foster_family'
    )),
    is_combat BOOLEAN DEFAULT false,
    is_combat_support BOOLEAN DEFAULT false,
    is_immigrant BOOLEAN DEFAULT false,
    parents_abroad BOOLEAN DEFAULT false,
    country_of_origin VARCHAR(100),
    recruit_date DATE,
    release_date DATE,
    immigration_date DATE,
    service_status VARCHAR(20) CHECK (service_status IN (
        'pre_service', 'in_service', 'released', 'reserves'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CASES
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    assigned_volunteer_id UUID REFERENCES users(id),
    case_status VARCHAR(30) DEFAULT 'open' CHECK (case_status IN (
        'open', 'in_progress', 'awaiting_human', 'awaiting_soldier', 'closed', 'archived'
    )),
    title VARCHAR(500),
    notes TEXT,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- CASE EVENTS
CREATE TABLE IF NOT EXISTS case_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    event_type VARCHAR(50) CHECK (event_type IN (
        'message', 'ai_suggestion', 'human_approval', 'human_rejection',
        'file_uploaded', 'form_generated', 'form_submitted',
        'eligibility_check', 'status_change', 'volunteer_assigned',
        'escalation', 'reminder_sent', 'note_added'
    )),
    payload JSONB,
    by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    filename VARCHAR(500),
    storage_path VARCHAR(1000),
    mime_type VARCHAR(100),
    file_size_bytes BIGINT,
    document_type VARCHAR(30) CHECK (document_type IN (
        'form_draft', 'form_approved', 'form_submitted',
        'supporting_doc', 'id_doc', 'response_from_authority', 'other'
    )),
    uploaded_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ELIGIBILITY RESULTS
CREATE TABLE IF NOT EXISTS eligibility_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    soldier_profile_id UUID REFERENCES soldier_profiles(id),
    results JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 'ready_for_review', 'approved', 'rejected'
    )),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
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

-- RIGHTS / ENTITLEMENTS
CREATE TABLE IF NOT EXISTS rights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    right_key VARCHAR(100) UNIQUE NOT NULL,
    title_he VARCHAR(500),
    title_en VARCHAR(500),
    description_he TEXT,
    description_en TEXT,
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'ILS',
    frequency VARCHAR(20),
    category VARCHAR(50),
    service_phase VARCHAR(30),
    conditions JSONB DEFAULT '[]',
    source_urls JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    last_verified TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RULES ENGINE
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    condition JSONB NOT NULL,
    consequence JSONB NOT NULL,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    source_url VARCHAR(1000),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT SESSIONS
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    case_id UUID REFERENCES cases(id),
    channel VARCHAR(20) CHECK (channel IN ('website', 'whatsapp', 'telegram', 'facebook', 'other')),
    language VARCHAR(5) DEFAULT 'he',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'escalated', 'closed')),
    escalated_to UUID REFERENCES users(id),
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

-- APPROVAL QUEUE
CREATE TABLE IF NOT EXISTS approval_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id),
    approval_type VARCHAR(50) CHECK (approval_type IN (
        'submit_form', 'send_to_authority', 'financial_action',
        'appeal', 'kb_update', 'eligibility_override'
    )),
    risk_level VARCHAR(10) CHECK (risk_level IN ('green', 'yellow', 'red')),
    ai_suggestion JSONB,
    ai_sources JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'changes_requested'
    )),
    decided_by UUID REFERENCES users(id),
    decision_comment TEXT,
    decided_at TIMESTAMPTZ,
    sla_deadline TIMESTAMPTZ,
    reminder_sent BOOLEAN DEFAULT false,
    escalated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FORM TEMPLATES
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(100) UNIQUE NOT NULL,
    title_he VARCHAR(500),
    title_en VARCHAR(500),
    fields JSONB NOT NULL,
    html_template TEXT,
    destination VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSLATIONS
CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(500) NOT NULL,
    language VARCHAR(5) NOT NULL,
    value TEXT NOT NULL,
    context VARCHAR(200),
    UNIQUE(key, language)
);

-- MILITARY GLOSSARY
CREATE TABLE IF NOT EXISTS glossary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_he VARCHAR(200) NOT NULL,
    term_en VARCHAR(200),
    term_ru VARCHAR(200),
    term_am VARCHAR(200),
    term_fr VARCHAR(200),
    term_es VARCHAR(200),
    term_ar VARCHAR(200),
    definition_he TEXT,
    definition_en TEXT,
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cases_user ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_volunteer ON cases(assigned_volunteer_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(case_status);
CREATE INDEX IF NOT EXISTS idx_case_events_case ON case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_approval_queue_status ON approval_queue(status);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_document ON kb_chunks(kb_document_id);
CREATE INDEX IF NOT EXISTS idx_translations_key_lang ON translations(key, language);

-- IVFFlat index for vector search (requires existing rows, ok to fail on empty table)
DO $$
BEGIN
    CREATE INDEX idx_kb_chunks_embedding ON kb_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Vector index creation skipped (will be created when data is added)';
END $$;

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

-- ======================== STEP 3: SEED DATA ========================

-- Test Users
INSERT INTO users (id, role, email, phone, full_name, preferred_language) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'soldier', 'daniel.cohen@test.com', '+972501234567', 'Daniel Cohen', 'he'),
    ('a2222222-2222-2222-2222-222222222222', 'soldier', 'sarah.johnson@test.com', '+972502345678', 'Sarah Johnson', 'en'),
    ('a3333333-3333-3333-3333-333333333333', 'soldier', 'alexey.petrov@test.com', '+972503456789', 'Alexey Petrov', 'ru')
ON CONFLICT DO NOTHING;

INSERT INTO users (id, role, email, phone, full_name, preferred_language) VALUES
    ('b1111111-1111-1111-1111-111111111111', 'volunteer', 'yael.levi@test.com', '+972504567890', 'Yael Levi', 'he'),
    ('b2222222-2222-2222-2222-222222222222', 'volunteer', 'michael.barak@test.com', '+972505678901', 'Michael Barak', 'he')
ON CONFLICT DO NOTHING;

INSERT INTO users (id, role, email, phone, full_name, preferred_language) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'admin', 'ronit.shemesh@test.com', '+972506789012', 'Ronit Shemesh', 'he')
ON CONFLICT DO NOTHING;

-- Soldier Profiles
INSERT INTO soldier_profiles (user_id, soldier_type, is_combat, is_immigrant, parents_abroad, country_of_origin, recruit_date, release_date, immigration_date, service_status) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'lone_classic', true, true, true, 'USA', '2024-07-01', '2027-07-01', '2024-01-15', 'in_service')
ON CONFLICT DO NOTHING;

INSERT INTO soldier_profiles (user_id, soldier_type, is_combat, is_combat_support, is_immigrant, parents_abroad, country_of_origin, recruit_date, release_date, immigration_date, service_status) VALUES
    ('a2222222-2222-2222-2222-222222222222', 'lone_classic', false, true, true, true, 'UK', '2024-11-01', '2026-11-01', '2024-06-01', 'in_service')
ON CONFLICT DO NOTHING;

INSERT INTO soldier_profiles (user_id, soldier_type, is_combat, is_combat_support, is_immigrant, parents_abroad, country_of_origin, recruit_date, release_date, immigration_date, service_status) VALUES
    ('a3333333-3333-3333-3333-333333333333', 'child_of_emigrants', false, true, true, true, 'Russia', '2025-03-01', '2027-03-01', '2020-08-15', 'in_service')
ON CONFLICT DO NOTHING;

-- Rules Engine
INSERT INTO rules (name, description, condition, consequence, priority, is_active) VALUES
    ('lone_soldier_monthly_stipend', 'Lone soldiers in active service receive a monthly stipend', '{"and": [{"field": "soldier_type", "operator": "in", "value": ["lone_classic", "child_of_emigrants", "child_of_envoys"]}, {"field": "service_status", "operator": "eq", "value": "in_service"}]}', '{"right_key": "monthly_stipend_lone", "title": "Monthly Lone Soldier Stipend", "amount": 1200, "currency": "ILS", "frequency": "monthly", "source": "Misrad HaBitachon"}', 10, true),
    ('combat_soldier_bonus', 'Combat soldiers receive an additional monthly combat bonus', '{"and": [{"field": "is_combat", "operator": "eq", "value": true}, {"field": "service_status", "operator": "eq", "value": "in_service"}]}', '{"right_key": "combat_bonus", "title": "Combat Soldier Monthly Bonus", "amount": 700, "currency": "ILS", "frequency": "monthly", "source": "IDF"}', 20, true),
    ('lone_soldier_rent_assistance', 'Lone soldiers living off-base are eligible for rent assistance', '{"and": [{"field": "soldier_type", "operator": "in", "value": ["lone_classic", "child_of_emigrants"]}, {"field": "service_status", "operator": "eq", "value": "in_service"}]}', '{"right_key": "rent_assistance", "title": "Rent Assistance Grant", "amount": 1100, "currency": "ILS", "frequency": "monthly", "source": "Misrad HaShikun"}', 15, true),
    ('immigrant_soldier_ulpan', 'Immigrant soldiers are entitled to a free Hebrew language course', '{"and": [{"field": "is_immigrant", "operator": "eq", "value": true}]}', '{"right_key": "ulpan_entitlement", "title": "Free Ulpan (Hebrew Course)", "amount": 0, "currency": "ILS", "frequency": "one_time", "source": "Misrad HaKlita"}', 5, true),
    ('lone_soldier_release_grant', 'Lone soldiers receive an enhanced release grant upon completing service', '{"and": [{"field": "soldier_type", "operator": "in", "value": ["lone_classic", "child_of_emigrants", "child_of_envoys", "no_family_support", "orphan", "foster_family"]}, {"field": "service_status", "operator": "in", "value": ["in_service", "released"]}]}', '{"right_key": "enhanced_release_grant", "title": "Enhanced Release Grant (Pikadon)", "amount": 25000, "currency": "ILS", "frequency": "one_time", "source": "Misrad HaBitachon"}', 10, true),
    ('pre_service_preparation', 'Lone soldiers in pre-service phase can attend a preparation program', '{"and": [{"field": "soldier_type", "operator": "in", "value": ["lone_classic", "child_of_emigrants"]}, {"field": "service_status", "operator": "eq", "value": "pre_service"}]}', '{"right_key": "mechina_program", "title": "Pre-Service Preparation Program (Mechina)", "amount": 0, "currency": "ILS", "frequency": "one_time", "source": "Ach Gadol / IDF"}', 5, true),
    ('emergency_financial_aid', 'All lone soldiers in active service facing hardship can request emergency aid', '{"and": [{"field": "soldier_type", "operator": "in", "value": ["lone_classic", "child_of_emigrants", "child_of_envoys", "no_family_support", "orphan", "foster_family"]}, {"field": "service_status", "operator": "eq", "value": "in_service"}]}', '{"right_key": "emergency_aid", "title": "Emergency Financial Assistance", "amount": 5000, "currency": "ILS", "frequency": "as_needed", "source": "Ach Gadol"}', 25, true)
ON CONFLICT DO NOTHING;

-- Knowledge Base Documents
INSERT INTO kb_documents (id, title, source_name, content, language, tags) VALUES
    ('d1111111-1111-1111-1111-111111111111', 'Lone Soldier Rights Overview', 'Ach Gadol Internal', 'Lone soldiers (Chayalim Bodedim) in the IDF are entitled to a range of benefits and support services. A lone soldier is defined as a soldier serving in the IDF whose parents do not reside in Israel, or who has no meaningful contact with their family. Categories include: classic lone soldiers who immigrated on their own, children of emigrants whose parents left Israel, children of envoys, soldiers with no family support, orphans, and those from foster families. Key entitlements include: monthly financial stipend from Misrad HaBitachon, rent assistance for off-base housing, enhanced release grant (pikadon), priority in military housing, access to pre-service preparation programs (Mechina), holiday hosting programs, and emergency financial assistance. Combat soldiers receive additional bonuses. Immigrant soldiers have extra rights including free Ulpan courses and absorption basket support.', 'he', '["lone_soldier", "rights", "overview", "benefits", "entitlements"]'),
    ('d2222222-2222-2222-2222-222222222222', 'How to Apply for Rent Assistance', 'Misrad HaShikun', 'Lone soldiers living off-base may apply for rent assistance through Misrad HaShikun (Ministry of Housing). The process involves: 1) Obtaining a lone soldier confirmation letter (Ishur Chayal Boded) from the IDF Personnel Directorate. 2) Gathering a signed rental agreement. 3) Providing a copy of military ID (Teudat Chayal). 4) Submitting bank account details for direct deposit. 5) Completing the application form available at Misrad HaShikun offices or online. Processing time is typically 4-6 weeks. The monthly amount is approximately 1,100 ILS but may vary based on location and circumstances. Soldiers can apply at any point during their service. For questions, contact the Misrad HaShikun hotline or speak with your unit welfare officer (Katzin Revaha).', 'he', '["rent", "housing", "application", "misrad_hashikun", "how_to"]'),
    ('d3333333-3333-3333-3333-333333333333', 'Release Process and Enhanced Pikadon', 'Misrad HaBitachon', 'Upon completing military service, lone soldiers are entitled to an enhanced release grant known as Pikadon. The standard pikadon for regular soldiers is a savings fund accumulated during service, but lone soldiers receive an additional grant from Misrad HaBitachon (Ministry of Defense). Key steps before release: 1) Confirm your lone soldier status is up to date in the system at least 3 months before release. 2) Attend the release preparation seminar offered by Ach Gadol. 3) Open a bank account if you do not have one. 4) Submit the pikadon application through your unit or directly via the Misrad HaBitachon portal. 5) Allow 60-90 days for processing after release date. The enhanced grant amount for lone soldiers is approximately 25,000 ILS on top of the regular pikadon. Released soldiers also gain access to post-service benefits including higher education tuition assistance and vocational training subsidies.', 'he', '["release", "pikadon", "grant", "misrad_habitachon", "post_service"]')
ON CONFLICT DO NOTHING;

-- Glossary
INSERT INTO glossary (term_he, term_en, term_ru, definition_he, definition_en, category) VALUES
    ('חייל בודד', 'Lone Soldier', 'Одинокий солдат', 'חייל המשרת בצה"ל שהוריו אינם מתגוררים בישראל, או שאין לו קשר משמעותי עם משפחתו', 'A soldier serving in the IDF whose parents do not reside in Israel, or who has no meaningful contact with their family', 'military'),
    ('פיקדון', 'Release Grant (Pikadon)', 'Накопительный грант', 'מענק שחרור הניתן לחיילים בתום שירותם הצבאי, חיילים בודדים זכאים למענק מוגדל', 'A release grant given to soldiers upon completing military service. Lone soldiers are entitled to an enhanced grant.', 'financial'),
    ('קצין רווחה', 'Welfare Officer', 'Офицер по социальным вопросам', 'קצין בצה"ל האחראי על רווחת החיילים ביחידה, כולל סיוע בתביעות זכויות', 'An IDF officer responsible for the welfare of soldiers in the unit, including assistance with rights claims', 'military'),
    ('משרד הביטחון', 'Ministry of Defense', 'Министерство обороны', 'משרד ממשלתי האחראי על ענייני ביטחון, כולל זכויות חיילים משוחררים וחיילים בודדים', 'Government ministry responsible for defense matters, including rights of released soldiers and lone soldiers', 'government'),
    ('אח גדול', 'Ach Gadol (Big Brother)', 'Ах Гадоль (Старший брат)', 'עמותה התומכת בחיילים בודדים בצה"ל באמצעות ליווי אישי, סיוע בירוקרטי, ומיצוי זכויות', 'An organization supporting lone soldiers in the IDF through personal mentorship, bureaucratic assistance, and rights advocacy', 'organization')
ON CONFLICT DO NOTHING;

-- ======================== DONE ========================
SELECT 'Database setup complete! All tables, functions, and seed data created.' AS status;
