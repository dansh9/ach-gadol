-- =============================================================================
-- Ach Gadol - Seed Data
-- =============================================================================

-- =============================================================================
-- USERS
-- =============================================================================

-- Test Soldiers
INSERT INTO users (id, role, email, phone, full_name, preferred_language) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'soldier', 'daniel.cohen@test.com', '+972501234567', 'Daniel Cohen', 'he'),
    ('a2222222-2222-2222-2222-222222222222', 'soldier', 'sarah.johnson@test.com', '+972502345678', 'Sarah Johnson', 'en'),
    ('a3333333-3333-3333-3333-333333333333', 'soldier', 'alexey.petrov@test.com', '+972503456789', 'Alexey Petrov', 'ru');

-- Test Volunteers
INSERT INTO users (id, role, email, phone, full_name, preferred_language) VALUES
    ('b1111111-1111-1111-1111-111111111111', 'volunteer', 'yael.levi@test.com', '+972504567890', 'Yael Levi', 'he'),
    ('b2222222-2222-2222-2222-222222222222', 'volunteer', 'michael.barak@test.com', '+972505678901', 'Michael Barak', 'he');

-- Admin
INSERT INTO users (id, role, email, phone, full_name, preferred_language) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'admin', 'ronit.shemesh@test.com', '+972506789012', 'Ronit Shemesh', 'he');

-- =============================================================================
-- SOLDIER PROFILES
-- =============================================================================

-- Daniel Cohen - Lone soldier (classic), combat, from USA
INSERT INTO soldier_profiles (user_id, soldier_type, is_combat, is_immigrant, parents_abroad, country_of_origin, recruit_date, release_date, immigration_date, service_status) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'lone_classic', true, true, true, 'USA', '2024-07-01', '2027-07-01', '2024-01-15', 'in_service');

-- Sarah Johnson - Lone soldier (classic), non-combat, from UK
INSERT INTO soldier_profiles (user_id, soldier_type, is_combat, is_combat_support, is_immigrant, parents_abroad, country_of_origin, recruit_date, release_date, immigration_date, service_status) VALUES
    ('a2222222-2222-2222-2222-222222222222', 'lone_classic', false, true, true, true, 'UK', '2024-11-01', '2026-11-01', '2024-06-01', 'in_service');

-- Alexey Petrov - Child of emigrants, combat support, from Russia
INSERT INTO soldier_profiles (user_id, soldier_type, is_combat, is_combat_support, is_immigrant, parents_abroad, country_of_origin, recruit_date, release_date, immigration_date, service_status) VALUES
    ('a3333333-3333-3333-3333-333333333333', 'child_of_emigrants', false, true, true, true, 'Russia', '2025-03-01', '2027-03-01', '2020-08-15', 'in_service');

-- =============================================================================
-- RULES (Eligibility Engine)
-- =============================================================================

-- Rule 1: Lone soldier monthly stipend
INSERT INTO rules (name, description, condition, consequence, priority, is_active) VALUES
    (
        'lone_soldier_monthly_stipend',
        'Lone soldiers in active service receive a monthly stipend from Misrad HaBitachon',
        '{"and": [{"field": "soldier_type", "operator": "in", "value": ["lone_classic", "child_of_emigrants", "child_of_envoys"]}, {"field": "service_status", "operator": "eq", "value": "in_service"}]}',
        '{"right_key": "monthly_stipend_lone", "title": "Monthly Lone Soldier Stipend", "amount": 1200, "currency": "ILS", "frequency": "monthly", "source": "Misrad HaBitachon"}',
        10,
        true
    );

-- Rule 2: Combat soldier bonus
INSERT INTO rules (name, description, condition, consequence, priority, is_active) VALUES
    (
        'combat_soldier_bonus',
        'Combat soldiers receive an additional monthly combat bonus',
        '{"and": [{"field": "is_combat", "operator": "eq", "value": true}, {"field": "service_status", "operator": "eq", "value": "in_service"}]}',
        '{"right_key": "combat_bonus", "title": "Combat Soldier Monthly Bonus", "amount": 700, "currency": "ILS", "frequency": "monthly", "source": "IDF"}',
        20,
        true
    );

-- Rule 3: Rent assistance for lone soldiers
INSERT INTO rules (name, description, condition, consequence, priority, is_active) VALUES
    (
        'lone_soldier_rent_assistance',
        'Lone soldiers who live off-base are eligible for rent assistance',
        '{"and": [{"field": "soldier_type", "operator": "in", "value": ["lone_classic", "child_of_emigrants"]}, {"field": "service_status", "operator": "eq", "value": "in_service"}]}',
        '{"right_key": "rent_assistance", "title": "Rent Assistance Grant", "amount": 1100, "currency": "ILS", "frequency": "monthly", "source": "Misrad HaShikun"}',
        15,
        true
    );

-- Rule 4: Immigrant soldier Hebrew course (Ulpan)
INSERT INTO rules (name, description, condition, consequence, priority, is_active) VALUES
    (
        'immigrant_soldier_ulpan',
        'Immigrant soldiers are entitled to a free Hebrew language course (Ulpan) during or after service',
        '{"and": [{"field": "is_immigrant", "operator": "eq", "value": true}]}',
        '{"right_key": "ulpan_entitlement", "title": "Free Ulpan (Hebrew Course)", "amount": 0, "currency": "ILS", "frequency": "one_time", "source": "Misrad HaKlita"}',
        5,
        true
    );

-- Rule 5: Release grant for lone soldiers
INSERT INTO rules (name, description, condition, consequence, priority, is_active) VALUES
    (
        'lone_soldier_release_grant',
        'Lone soldiers receive an enhanced release grant (pikadon) upon completing service',
        '{"and": [{"field": "soldier_type", "operator": "in", "value": ["lone_classic", "child_of_emigrants", "child_of_envoys", "no_family_support", "orphan", "foster_family"]}, {"field": "service_status", "operator": "in", "value": ["in_service", "released"]}]}',
        '{"right_key": "enhanced_release_grant", "title": "Enhanced Release Grant (Pikadon)", "amount": 25000, "currency": "ILS", "frequency": "one_time", "source": "Misrad HaBitachon"}',
        10,
        true
    );

-- Rule 6: Pre-service preparation program
INSERT INTO rules (name, description, condition, consequence, priority, is_active) VALUES
    (
        'pre_service_preparation',
        'Lone soldiers in pre-service phase can attend a preparation program (Mechina)',
        '{"and": [{"field": "soldier_type", "operator": "in", "value": ["lone_classic", "child_of_emigrants"]}, {"field": "service_status", "operator": "eq", "value": "pre_service"}]}',
        '{"right_key": "mechina_program", "title": "Pre-Service Preparation Program (Mechina)", "amount": 0, "currency": "ILS", "frequency": "one_time", "source": "Ach Gadol / IDF"}',
        5,
        true
    );

-- Rule 7: Emergency financial assistance
INSERT INTO rules (name, description, condition, consequence, priority, is_active) VALUES
    (
        'emergency_financial_aid',
        'All lone soldiers in active service facing financial hardship can request emergency financial aid',
        '{"and": [{"field": "soldier_type", "operator": "in", "value": ["lone_classic", "child_of_emigrants", "child_of_envoys", "no_family_support", "orphan", "foster_family"]}, {"field": "service_status", "operator": "eq", "value": "in_service"}]}',
        '{"right_key": "emergency_aid", "title": "Emergency Financial Assistance", "amount": 5000, "currency": "ILS", "frequency": "as_needed", "source": "Ach Gadol"}',
        25,
        true
    );

-- =============================================================================
-- KNOWLEDGE BASE DOCUMENTS
-- =============================================================================

-- KB Doc 1: Overview of lone soldier rights
INSERT INTO kb_documents (id, title, source_name, source_url, content, language, tags) VALUES
    (
        'd1111111-1111-1111-1111-111111111111',
        'Lone Soldier Rights Overview',
        'Ach Gadol Internal',
        'https://www.kolzchut.org.il/he/חיילים_בודדים',
        'Lone soldiers (Chayalim Bodedim) in the IDF are entitled to a range of benefits and support services. A lone soldier is defined as a soldier serving in the IDF whose parents do not reside in Israel, or who has no meaningful contact with their family. Categories include: classic lone soldiers who immigrated on their own, children of emigrants whose parents left Israel, children of envoys, soldiers with no family support, orphans, and those from foster families. Key entitlements include: monthly financial stipend from Misrad HaBitachon, rent assistance for off-base housing, enhanced release grant (pikadon), priority in military housing, access to pre-service preparation programs (Mechina), holiday hosting programs, and emergency financial assistance. Combat soldiers receive additional bonuses. Immigrant soldiers have extra rights including free Ulpan courses and absorption basket support.',
        'he',
        '["lone_soldier", "rights", "overview", "benefits", "entitlements"]'
    );

-- KB Doc 2: How to apply for rent assistance
INSERT INTO kb_documents (id, title, source_name, source_url, content, language, tags) VALUES
    (
        'd2222222-2222-2222-2222-222222222222',
        'How to Apply for Rent Assistance',
        'Misrad HaShikun',
        'https://www.kolzchut.org.il/he/סיוע_בהוצאות_דיור_לחיילים_בודדים',
        'Lone soldiers living off-base may apply for rent assistance through Misrad HaShikun (Ministry of Housing). The process involves: 1) Obtaining a lone soldier confirmation letter (Ishur Chayal Boded) from the IDF Personnel Directorate. 2) Gathering a signed rental agreement. 3) Providing a copy of military ID (Teudat Chayal). 4) Submitting bank account details for direct deposit. 5) Completing the application form available at Misrad HaShikun offices or online. Processing time is typically 4-6 weeks. The monthly amount is approximately 1,100 ILS but may vary based on location and circumstances. Soldiers can apply at any point during their service. For questions, contact the Misrad HaShikun hotline or speak with your unit welfare officer (Katzin Revaha).',
        'he',
        '["rent", "housing", "application", "misrad_hashikun", "how_to"]'
    );

-- KB Doc 3: Release process and pikadon
INSERT INTO kb_documents (id, title, source_name, source_url, content, language, tags) VALUES
    (
        'd3333333-3333-3333-3333-333333333333',
        'Release Process and Enhanced Pikadon',
        'Misrad HaBitachon',
        'https://www.kolzchut.org.il/he/פיקדון_אישי_לחיילים_משוחררים_ומסיימי_שירות_לאומי-אזרחי',
        'Upon completing military service, lone soldiers are entitled to an enhanced release grant known as Pikadon. The standard pikadon for regular soldiers is a savings fund accumulated during service, but lone soldiers receive an additional grant from Misrad HaBitachon (Ministry of Defense). Key steps before release: 1) Confirm your lone soldier status is up to date in the system at least 3 months before release. 2) Attend the release preparation seminar offered by Ach Gadol. 3) Open a bank account if you do not have one. 4) Submit the pikadon application through your unit or directly via the Misrad HaBitachon portal. 5) Allow 60-90 days for processing after release date. The enhanced grant amount for lone soldiers is approximately 25,000 ILS on top of the regular pikadon. Released soldiers also gain access to post-service benefits including higher education tuition assistance and vocational training subsidies.',
        'he',
        '["release", "pikadon", "grant", "misrad_habitachon", "post_service"]'
    );

-- =============================================================================
-- GLOSSARY
-- =============================================================================

INSERT INTO glossary (term_he, term_en, term_ru, definition_he, definition_en, category) VALUES
    (
        'חייל בודד',
        'Lone Soldier',
        'Одинокий солдат',
        'חייל המשרת בצה"ל שהוריו אינם מתגוררים בישראל, או שאין לו קשר משמעותי עם משפחתו',
        'A soldier serving in the IDF whose parents do not reside in Israel, or who has no meaningful contact with their family',
        'military'
    ),
    (
        'פיקדון',
        'Release Grant (Pikadon)',
        'Накопительный грант',
        'מענק שחרור הניתן לחיילים בתום שירותם הצבאי, חיילים בודדים זכאים למענק מוגדל',
        'A release grant given to soldiers upon completing military service. Lone soldiers are entitled to an enhanced grant.',
        'financial'
    ),
    (
        'קצין רווחה',
        'Welfare Officer',
        'Офицер по социальным вопросам',
        'קצין בצה"ל האחראי על רווחת החיילים ביחידה, כולל סיוע בתביעות זכויות',
        'An IDF officer responsible for the welfare of soldiers in the unit, including assistance with rights claims',
        'military'
    ),
    (
        'משרד הביטחון',
        'Ministry of Defense',
        'Министерство обороны',
        'משרד ממשלתי האחראי על ענייני ביטחון, כולל זכויות חיילים משוחררים וחיילים בודדים',
        'Government ministry responsible for defense matters, including rights of released soldiers and lone soldiers',
        'government'
    ),
    (
        'אח גדול',
        'Ach Gadol (Big Brother)',
        'Ах Гадоль (Старший брат)',
        'עמותה התומכת בחיילים בודדים בצה"ל באמצעות ליווי אישי, סיוע בירוקרטי, ומיצוי זכויות',
        'An organization supporting lone soldiers in the IDF through personal mentorship, bureaucratic assistance, and rights advocacy',
        'organization'
    );
