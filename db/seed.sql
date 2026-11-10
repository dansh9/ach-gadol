-- =============================================================================
-- Ach Gadol - Seed Data
-- =============================================================================

-- KNOWLEDGE BASE DOCUMENTS

INSERT INTO kb_documents (id, title, source_name, source_url, content, language, tags) VALUES
    (
        'd1111111-1111-1111-1111-111111111111',
        'Lone Soldier Rights Overview',
        'Ach Gadol Internal',
        'https://www.kolzchut.org.il/he/חיילים_בודדים',
        'Lone soldiers (Chayalim Bodedim) in the IDF are entitled to a range of benefits and support services. A lone soldier is defined as a soldier serving in the IDF whose parents do not reside in Israel, or who has no meaningful contact with their family. Categories include: classic lone soldiers who immigrated on their own, children of emigrants whose parents left Israel, children of envoys, soldiers with no family support, orphans, and those from foster families.',
        'he',
        '["lone_soldier", "rights", "overview", "benefits", "entitlements"]'
    ),
    (
        'd2222222-2222-2222-2222-222222222222',
        'How to Apply for Rent Assistance',
        'Misrad HaShikun',
        'https://www.kolzchut.org.il/he/סיוע_בהוצאות_דיור_לחיילים_בודדים',
        'Lone soldiers living off-base may apply for rent assistance through Misrad HaShikun (Ministry of Housing). The process involves obtaining a lone soldier confirmation letter, gathering a signed rental agreement, providing a copy of military ID, and submitting bank account details.',
        'he',
        '["rent", "housing", "application", "misrad_hashikun", "how_to"]'
    ),
    (
        'd3333333-3333-3333-3333-333333333333',
        'Release Process and Enhanced Pikadon',
        'Misrad HaBitachon',
        'https://www.kolzchut.org.il/he/פיקדון_אישי_לחיילים_משוחררים_ומסיימי_שירות_לאומי-אזרחי',
        'Upon completing military service, lone soldiers are entitled to an enhanced release grant known as Pikadon. Lone soldiers receive an additional grant from Misrad HaBitachon on top of the regular pikadon.',
        'he',
        '["release", "pikadon", "grant", "misrad_habitachon", "post_service"]'
    )
ON CONFLICT DO NOTHING;
