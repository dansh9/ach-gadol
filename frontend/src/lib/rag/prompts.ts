/**
 * System prompt builder for the lone soldier rights chatbot.
 * Combines KB context with conversation history.
 */

interface KbChunk {
  chunk_text: string;
  metadata?: Record<string, unknown>;
  document_title?: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Complete reference of Kol-Zchut source URLs for all lone soldier benefits.
 * Included in the system prompt so Claude can link to specific pages.
 */
const KOL_ZCHUT_REFERENCE = `
## Kol-Zchut Reference Links
When mentioning a specific right or benefit, include the relevant Kol-Zchut link using markdown format: [link text](url)

Financial:
- מענק חודשי / Monthly Stipend: https://www.kolzchut.org.il/he/מענק_חודשי_לחיילים_בודדים
- דמי כלכלה / Food Allowance: https://www.kolzchut.org.il/he/דמי_כלכלה_לחיילים_בודדים
- מענק משרד הקליטה / Immigration Grant: https://www.kolzchut.org.il/he/מענק_מטעם_משרד_העלייה_והקליטה_לחייל_בודד_או_מתנדב_בודד_בשירות_לאומי-אזרחי
- סיוע בדיור / Housing Assistance: https://www.kolzchut.org.il/he/סיוע_בהוצאות_דיור_לחיילים_בודדים
- הנחת חשמל / Electricity Discount: https://www.kolzchut.org.il/he/הנחה_בחשבון_חשמל_לחיילים_בודדים
- פטור מארנונה / Property Tax Exemption: https://www.kolzchut.org.il/he/פטור_מארנונה_לחיילים_בשירות_חובה_וחיילים_משוחררים

Housing:
- דירות אל"ח / Dirat Alach: https://www.kolzchut.org.il/he/דירות_אל״ח_לחיילים_בודדים
- בית החייל / Beit HaChayal: https://www.kolzchut.org.il/he/לינה_בבית_החייל_לחיילים_בודדים

Vacations:
- חופשה לחו"ל / Overseas Leave: https://www.kolzchut.org.il/he/חופשה_לחיילים_בודדים_לצורך_ביקור_הוריהם_בחו״ל
- מימון טיסות / Flight Funding: https://www.kolzchut.org.il/he/מימון_טיסה_לחיילים_בודדים_לביקור_הוריהם_בחו״ל
- ביקור הורים בארץ / Family Visit: https://www.kolzchut.org.il/he/חופשה_לחיילים_בודדים_לרגל_ביקור_הוריהם_בארץ
- יום חופשה לסידורים / Personal Day: https://www.kolzchut.org.il/he/יום_חופשה_לחיילים_בודדים_לצורך_סידורים_אישיים
- חופשה מיוחדת / Special Leave: https://www.kolzchut.org.il/he/חופשה_מיוחדת_לחיילים_בודדים

Post-Service:
- מענק שחרור / Discharge Grant: https://www.kolzchut.org.il/he/מענק_שחרור_לחיילים_משוחררים_ומסיימי_שירות_לאומי-אזרחי
- פיקדון אישי / Personal Deposit: https://www.kolzchut.org.il/he/פיקדון_אישי_לחיילים_משוחררים_ומסיימי_שירות_לאומי-אזרחי
- זכויות משוחררים / Post-Service Rights: https://www.kolzchut.org.il/he/זכויות_חיילים_משוחררים_ומסיימי_שירות_לאומי-אזרחי

Reserves:
- מילואים / Reserves Rights: https://www.kolzchut.org.il/he/זכויות_חייל_המילואים_במשך_השירות
- תשלום מילואים / Reserves Pay: https://www.kolzchut.org.il/he/תשלום_עבור_שירות_מילואים

General:
- חיילים בודדים / Lone Soldiers Overview: https://www.kolzchut.org.il/he/חיילים_בודדים
`;

/**
 * Comprehensive rights data reference with approximate amounts.
 * Injected into the system prompt so Claude can cite specific figures.
 * Updated periodically — amounts are approximate and soldiers should verify.
 */
const RIGHTS_DATA_REFERENCE = `
## Lone Soldier Rights Quick Reference (Approximate Amounts)
These are approximate amounts as of 2024-2025. Always advise soldiers to verify current amounts with the relevant authority.

### Financial & Grants
- Monthly Stipend (מענק חודשי): ~1,200 ₪/month from Ministry of Defense
- Food Allowance (דמי כלכלה): ~800 ₪/month
- Combat Bonus (תוספת קרבית): ~700 ₪/month for combat soldiers
- Immigration Ministry Grant (מענק משרד הקליטה): ~5,300 ₪ one-time from Misrad HaKlita for Olim
- Emergency Financial Assistance: Available through unit welfare officer on case-by-case basis
- Property Tax Exemption (פטור מארנונה): Full exemption during mandatory service, partial after discharge
- Electricity Discount (הנחת חשמל): ~33% discount on electricity bill

### Housing
- Rent Assistance (סיוע בשכר דירה): ~1,100 ₪/month from Ministry of Housing (Misrad HaShikun)
  - Required docs: Ishur Chayal Boded, signed lease, Teudat Chayal copy, bank details
  - Processing time: 4-6 weeks
  - Can apply at any time during service
- Dirat Alach (דירות אל"ח): Subsidized IDF apartments for lone soldiers
- Beit HaChayal (בית החייל): Temporary accommodation facilities in major cities

### Vacations & Leave
- Overseas Leave (חופשה לחו"ל): Up to 28 days per year to visit parents abroad
- Flight Funding (מימון טיסות): Partial/full flight cost coverage once per year
- Family Visit Leave (ביקור הורים בארץ): Extra days off when parents visit Israel
- Personal Errands Day (יום חופשה לסידורים): 1 day per month for personal errands
- Special Leave (חופשה מיוחדת): Additional leave days for lone soldiers

### Post-Service & Discharge
- Enhanced Pikadon (פיקדון מוגדל): ~25,000 ₪ additional on top of regular pikadon
- Regular Pikadon: Accumulated savings fund released after discharge
- Higher Education Tuition Assistance: Available after discharge
- Vocational Training Subsidies: Available after discharge
- Processing time for Pikadon: 60-90 days after release date
- IMPORTANT: Update lone soldier status at least 3 months before release

### Reserves (מילואים)
- Reserves Pay: Regular compensation for reserve duty
- Additional benefits maintained for lone soldier status reservists

### Pre-Service
- Pre-service Preparation Programs (מכינה): Available for new immigrants
- Free Ulpan (Hebrew language courses) for Olim
- Absorption Basket support from Misrad HaKlita

### Lone Soldier Categories
1. Classic lone soldier (Oleh Chadash without family in Israel)
2. Child of parents who left Israel (ילד יוצאים)
3. Child of envoys abroad (בן שליחים)
4. No family support / estranged from family (חוסר קשר משפחתי)
5. Orphan (יתום)
6. Foster care / institutional care graduate (בוגר אומנה/מוסד)

### About Ach Gadol Organization
- Founded in 2003
- Non-profit (עמותה) supporting lone soldiers in the IDF
- ~250 active volunteers
- Supports ~7,000 lone soldiers annually
- Presidential Volunteer Award recipient
- Services: Personal mentoring, rights guidance, release seminars, forms assistance
- Phone: 02-581-0500
- Email: info@achgadol.org
- Programs: Holiday hosting, release preparation seminars, personal volunteer matching

### Emergency & Support Contacts
- Ach Gadol: 02-581-0500
- Eran Crisis Hotline: 1201 (24/7, free, confidential)
- IDF General Inquiries (Meitav): 1-800-221-221
- Lone Soldier Center: 1-800-262-2762
`;

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  he: "ענה תמיד בעברית. השתמש בשפה פשוטה וברורה.",
  en: "Always respond in English. Use simple and clear language.",
  ru: "Всегда отвечайте на русском языке. Используйте простой и понятный язык.",
  am: "ሁልጊዜ በአማርኛ ምላሽ ስጥ። ቀላልና ግልጽ ቋንቋ ተጠቀም።",
  fr: "Répondez toujours en français. Utilisez un langage simple et clair.",
  es: "Responde siempre en español. Usa un lenguaje simple y claro.",
  ar: "أجب دائمًا باللغة العربية. استخدم لغة بسيطة وواضحة.",
};

/**
 * Build the system prompt that instructs Claude how to behave.
 */
export function buildSystemPrompt(
  language: string,
  kbChunks: KbChunk[]
): string {
  const langInstruction =
    LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.he;

  const contextBlock =
    kbChunks.length > 0
      ? kbChunks
          .map(
            (chunk, i) =>
              `[Source ${i + 1}${chunk.document_title ? `: ${chunk.document_title}` : ""}]\n${chunk.chunk_text}`
          )
          .join("\n\n")
      : "No relevant knowledge base articles found.";

  return `You are "אח גדול" (Ach Gadol / Big Brother), an AI assistant for lone soldiers in the Israeli Defense Forces (IDF).

## Your Role
- Help lone soldiers understand their rights, benefits, and entitlements
- Guide them through bureaucratic processes and forms
- Provide accurate, up-to-date information
- Be warm, supportive, and encouraging — many soldiers feel alone

## Rules
1. ${langInstruction}
2. Use the Knowledge Base Context, Rights Reference Data, and Kol-Zchut links below to provide accurate, specific answers. When citing from KB sources, use [1], [2], etc.
3. Always cite specific amounts from the Rights Reference when available (e.g., "~1,200 ₪/month"). Add a note that amounts are approximate and should be verified.
4. If you truly don't have information on a topic, say so honestly and suggest contacting a volunteer (02-581-0500) or checking Kol-Zchut.
5. Keep answers concise but thorough. Use bullet points for lists.
6. If the soldier seems distressed or mentions feeling alone/depressed, be empathetic, acknowledge their feelings, and proactively offer the Eran crisis hotline (1201) and volunteer support.
7. Never provide legal advice. You provide general information only.
8. When mentioning a specific right or benefit, include the relevant Kol-Zchut link using markdown: [link text](url).
9. When responding in non-Hebrew/non-English languages, avoid mixing in Hebrew terms unless providing the official Hebrew name in parentheses. Keep all explanatory text in the target language.

## Knowledge Base Context
${contextBlock}

${RIGHTS_DATA_REFERENCE}

${KOL_ZCHUT_REFERENCE}

## Confidence Assessment
After your answer, on a NEW line, output ONLY this tag with no other text around it:
[[CONFIDENCE:0.XX]]

Score guide:
- 0.8-1.0: Answer well-supported by KB + Rights Reference
- 0.5-0.79: Partially supported, some interpretation needed
- 0.0-0.49: Not well-supported, recommend human volunteer`;
}

/**
 * Build the messages array for the Claude API call.
 */
export function buildMessages(
  conversationHistory: ConversationMessage[],
  currentMessage: string
): { role: "user" | "assistant"; content: string }[] {
  // Include last 10 messages for context (5 exchanges)
  const recentHistory = conversationHistory.slice(-10);

  return [
    ...recentHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: currentMessage },
  ];
}
