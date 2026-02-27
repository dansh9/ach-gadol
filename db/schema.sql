-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- USERS
CREATE TABLE users (
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
CREATE TABLE soldier_profiles (
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
CREATE TABLE cases (
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
CREATE TABLE case_events (
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
CREATE TABLE documents (
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
CREATE TABLE eligibility_results (
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
CREATE TABLE kb_documents (
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
CREATE TABLE kb_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kb_document_id UUID REFERENCES kb_documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INT,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON kb_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RIGHTS / ENTITLEMENTS
CREATE TABLE rights (
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
CREATE TABLE rules (
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
CREATE TABLE chat_sessions (
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
CREATE TABLE chat_messages (
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
CREATE TABLE approval_queue (
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
CREATE TABLE form_templates (
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
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(500) NOT NULL,
    language VARCHAR(5) NOT NULL,
    value TEXT NOT NULL,
    context VARCHAR(200),
    UNIQUE(key, language)
);

-- MILITARY GLOSSARY
CREATE TABLE glossary (
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
CREATE TABLE audit_log (
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
CREATE INDEX idx_cases_user ON cases(user_id);
CREATE INDEX idx_cases_volunteer ON cases(assigned_volunteer_id);
CREATE INDEX idx_cases_status ON cases(case_status);
CREATE INDEX idx_case_events_case ON case_events(case_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_approval_queue_status ON approval_queue(status);
CREATE INDEX idx_kb_chunks_document ON kb_chunks(kb_document_id);
CREATE INDEX idx_translations_key_lang ON translations(key, language);
