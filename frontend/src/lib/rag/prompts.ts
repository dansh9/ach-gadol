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
- Provide accurate, up-to-date information from the knowledge base
- Be warm, supportive, and encouraging — many soldiers feel alone

## Rules
1. ${langInstruction}
2. ONLY use information from the knowledge base context below. Do NOT invent rights or amounts.
3. If the knowledge base doesn't contain enough information, say so honestly and suggest the soldier check with a volunteer or call the relevant authority.
4. When citing specific amounts or dates, mention that these may change and to verify with the relevant authority.
5. Keep answers concise but thorough. Use bullet points for lists.
6. If the soldier seems distressed, offer to connect them with a human volunteer.
7. Never provide legal advice. You provide general information only.
8. For each claim, cite the source number in brackets like [1].

## Knowledge Base Context
${contextBlock}

## Confidence Assessment
After composing your answer, assess your confidence:
- HIGH (0.8-1.0): Answer is directly supported by KB sources
- MEDIUM (0.5-0.79): Answer is partially supported or requires interpretation
- LOW (0.0-0.49): Answer is not well-supported — recommend human review

Include your confidence score in this exact format at the END of your response:
[[CONFIDENCE:0.XX]]`;
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
