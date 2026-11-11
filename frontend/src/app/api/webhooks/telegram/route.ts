import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { handleIncomingMessage, endSession } from "@/lib/channels/handler";
import { detectLanguage } from "@/lib/rag/language";
import {
  sendTelegramMessage,
  sendTypingAction,
  answerCallbackQuery,
  parseFollowUps,
  buildInlineKeyboard,
  buildLanguageKeyboard,
  convertToTelegramHtml,
  splitLongMessage,
} from "@/lib/channels/telegram";

// Allow up to 30s for the AI pipeline (embed + search + Claude)
export const maxDuration = 60;

const TELEGRAM_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

/* ===== Rate Limiter (in-memory, per Telegram chat) ===== */
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 15;     // max 15 messages per minute per user

const chatHits = new Map<number, { count: number; resetAt: number }>();

function isRateLimited(chatId: number): boolean {
  const now = Date.now();
  pruneHits(now);
  const entry = chatHits.get(chatId);

  if (!entry || now > entry.resetAt) {
    chatHits.set(chatId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}

// Pruned opportunistically: a module-scope setInterval never fires reliably
// in a serverless runtime. Note this limiter is per instance (AG-SEC-08).
function pruneHits(now: number): void {
  if (chatHits.size < 5000) return;
  chatHits.forEach((entry, id) => {
    if (now > entry.resetAt) chatHits.delete(id);
  });
}

/* ===== Per-user language preference (in-memory, survives warm instances) ===== */
const userLanguageMap = new Map<number, string>();

/* ===== Messages — single language per user, no mixing ===== */

const WELCOME_MESSAGE = [
  "שלום! 👋 אני <b>אח גדול</b>, בוט AI לעזרה לחיילים בודדים.",
  "",
  "בחר שפה:",
].join("\n");

const LANGUAGE_SELECTED: Record<string, string> = {
  he: "✅ השפה נבחרה: עברית.\n\nשלח לי שאלה על זכויות, הטבות, דיור, או כל נושא אחר.",
  en: "✅ Language set: English.\n\nSend me a question about rights, benefits, housing, or any topic.",
  ru: "✅ Язык выбран: Русский.\n\nОтправьте мне вопрос о правах, льготах, жилье или другой теме.",
  am: "✅ ቋንቋ ተመርጧል: አማርኛ.\n\nስለ መብቶች፣ ጥቅማ ጥቅሞች ወይም ሌላ ርዕስ ጥያቄ ላኩልኝ።",
  fr: "✅ Langue choisie: Français.\n\nPosez-moi une question sur les droits, les prestations ou tout autre sujet.",
  es: "✅ Idioma seleccionado: Español.\n\nEnvíame una pregunta sobre derechos, beneficios o cualquier tema.",
  ar: "✅ تم اختيار اللغة: العربية.\n\nأرسل لي سؤالاً عن الحقوق أو المزايا أو أي موضوع آخر.",
};

const HELP_MESSAGES: Record<string, string> = {
  he: [
    "🔹 שלח לי שאלה על זכויות, הטבות, דיור, או כל נושא אחר",
    "🔹 לחץ על כפתורי השאלות המוצעות לשאלות נפוצות",
    "🔹 /reset — התחל שיחה חדשה",
    "🔹 /lang — החלף שפה",
    "🔹 /help — הצג הודעה זו",
  ].join("\n"),
  en: [
    "🔹 Send me a question about rights, benefits, housing, or any topic",
    "🔹 Tap the suggested question buttons for common follow-ups",
    "🔹 /reset — Start a new conversation",
    "🔹 /lang — Change language",
    "🔹 /help — Show this message",
  ].join("\n"),
  ru: [
    "🔹 Отправьте мне вопрос о правах, льготах, жилье или другой теме",
    "🔹 Нажмите на кнопки с предложенными вопросами",
    "🔹 /reset — Начать новый разговор",
    "🔹 /lang — Сменить язык",
    "🔹 /help — Показать это сообщение",
  ].join("\n"),
  am: [
    "🔹 ስለ መብቶች፣ ጥቅማ ጥቅሞች፣ መኖሪያ ወይም ሌላ ርዕስ ጥያቄ ላኩልኝ",
    "🔹 /reset — አዲስ ውይይት ጀምር",
    "🔹 /lang — ቋንቋ ቀይር",
    "🔹 /help — ይህን መልእክት አሳይ",
  ].join("\n"),
  fr: [
    "🔹 Posez-moi une question sur les droits, les prestations, le logement ou tout autre sujet",
    "🔹 Appuyez sur les boutons de questions suggérées",
    "🔹 /reset — Nouvelle conversation",
    "🔹 /lang — Changer de langue",
    "🔹 /help — Afficher ce message",
  ].join("\n"),
  es: [
    "🔹 Envíame una pregunta sobre derechos, beneficios, vivienda o cualquier tema",
    "🔹 Toca los botones de preguntas sugeridas",
    "🔹 /reset — Nueva conversación",
    "🔹 /lang — Cambiar idioma",
    "🔹 /help — Mostrar este mensaje",
  ].join("\n"),
  ar: [
    "🔹 أرسل لي سؤالاً عن الحقوق أو المزايا أو السكن أو أي موضوع آخر",
    "🔹 اضغط على أزرار الأسئلة المقترحة",
    "🔹 /reset — محادثة جديدة",
    "🔹 /lang — تغيير اللغة",
    "🔹 /help — عرض هذه الرسالة",
  ].join("\n"),
};

const RESET_MESSAGES: Record<string, string> = {
  he: "🔄 השיחה אופסה. שלח שאלה חדשה כדי להתחיל.",
  en: "🔄 Conversation reset. Send a new question to start.",
  ru: "🔄 Разговор сброшен. Отправьте новый вопрос.",
  am: "🔄 ውይይቱ ተቀየረ። አዲስ ጥያቄ ላኩ።",
  fr: "🔄 Conversation réinitialisée. Envoyez une nouvelle question.",
  es: "🔄 Conversación reiniciada. Envía una nueva pregunta.",
  ar: "🔄 تم إعادة تعيين المحادثة. أرسل سؤالاً جديداً.",
};

const RATE_LIMIT_MESSAGES: Record<string, string> = {
  he: "⏳ יותר מדי הודעות. חכה רגע ונסה שוב.",
  en: "⏳ Too many messages. Please wait a moment and try again.",
  ru: "⏳ Слишком много сообщений. Подождите и попробуйте снова.",
  am: "⏳ በጣም ብዙ መልእክቶች። እባክዎ ትንሽ ይጠብቁ።",
  fr: "⏳ Trop de messages. Veuillez patienter un instant.",
  es: "⏳ Demasiados mensajes. Espera un momento e intenta de nuevo.",
  ar: "⏳ رسائل كثيرة جداً. انتظر لحظة وحاول مرة أخرى.",
};

const ERROR_MESSAGES: Record<string, string> = {
  he: "⚠️ שגיאה בעיבוד ההודעה. נסה שוב.",
  en: "⚠️ Error processing message. Please try again.",
  ru: "⚠️ Ошибка обработки. Попробуйте снова.",
  am: "⚠️ ስህተት ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።",
  fr: "⚠️ Erreur de traitement. Veuillez réessayer.",
  es: "⚠️ Error al procesar. Inténtalo de nuevo.",
  ar: "⚠️ خطأ في المعالجة. حاول مرة أخرى.",
};

/** Get the user's saved language, falling back to "he" */
function getUserLang(chatId: number): string {
  return userLanguageMap.get(chatId) || "he";
}

/** Get a localized message for the user */
function localized(messages: Record<string, string>, chatId: number): string {
  const lang = getUserLang(chatId);
  return messages[lang] || messages.he;
}

/**
 * POST /api/webhooks/telegram
 * Handles both message updates and callback_query (inline keyboard button presses).
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { error: "Telegram bot not configured" },
        { status: 503 }
      );
    }

    /* AG-SEC-07: fail CLOSED. The check used to be skipped entirely when no
     * secret was configured, which left the endpoint open to forged updates. */
    if (!TELEGRAM_SECRET) {
      console.error("TELEGRAM_WEBHOOK_SECRET is not set — refusing webhook traffic");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
    const given = Buffer.from(secretHeader || "");
    const want = Buffer.from(TELEGRAM_SECRET);
    if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const update = await request.json();

    // Route to the appropriate handler
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    } else if (update.message?.text) {
      await handleTextMessage(update.message);
    }

    // Always return 200 to Telegram (avoid retries)
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

/* ===== Message Handlers ===== */

async function handleTextMessage(message: {
  chat: { id: number };
  text: string;
  from?: { language_code?: string };
}): Promise<void> {
  const chatId = message.chat.id;
  const text = message.text.trim();

  // /start — show language selection
  if (text === "/start") {
    await sendTelegramMessage(chatId, WELCOME_MESSAGE, {
      reply_markup: buildLanguageKeyboard(),
    });
    return;
  }

  // /lang — change language
  if (text === "/lang") {
    await sendTelegramMessage(chatId, WELCOME_MESSAGE, {
      reply_markup: buildLanguageKeyboard(),
    });
    return;
  }

  // /help — in user's saved language
  if (text === "/help") {
    await sendTelegramMessage(chatId, localized(HELP_MESSAGES, chatId));
    return;
  }

  // /reset — end session, in user's saved language
  if (text === "/reset") {
    await endSession("telegram", String(chatId));
    await sendTelegramMessage(chatId, localized(RESET_MESSAGES, chatId));
    return;
  }

  // Rate limit check
  if (isRateLimited(chatId)) {
    await sendTelegramMessage(chatId, localized(RATE_LIMIT_MESSAGES, chatId));
    return;
  }

  // Regular message — use saved language (don't auto-detect, stay consistent)
  await processAndReply(chatId, text);
}

async function handleCallbackQuery(callbackQuery: {
  id: string;
  message?: { chat: { id: number } };
  data?: string;
}): Promise<void> {
  // Acknowledge the button press immediately
  await answerCallbackQuery(callbackQuery.id);

  const chatId = callbackQuery.message?.chat.id;
  const data = callbackQuery.data;

  if (!chatId || !data) return;

  // Handle language selection — save it and confirm
  if (data.startsWith("lang:")) {
    const lang = data.slice(5);
    userLanguageMap.set(chatId, lang);
    const confirmText = LANGUAGE_SELECTED[lang] || LANGUAGE_SELECTED.he;
    await sendTelegramMessage(chatId, confirmText);
    return;
  }

  // Treat callback data as a new user message (follow-up suggestion)
  await processAndReply(chatId, data);
}

/* ===== Core Processing ===== */

/**
 * Process a user message through the RAG pipeline and send the formatted response.
 * Uses the user's saved language preference — no language mixing.
 */
async function processAndReply(
  chatId: number,
  text: string
): Promise<void> {
  // Use saved language preference; fall back to detection only if no preference set
  const language = userLanguageMap.has(chatId)
    ? getUserLang(chatId)
    : detectLanguage(text);

  try {
    // Show typing indicator
    await sendTypingAction(chatId);

    // Run through the shared channel handler
    const result = await handleIncomingMessage({
      externalId: String(chatId),
      text,
      channel: "telegram",
      language,
    });

    // Parse follow-up suggestions from the reply
    const { mainContent, suggestions } = parseFollowUps(result.text);

    // Convert Markdown to Telegram HTML
    const htmlContent = convertToTelegramHtml(mainContent);

    // Build inline keyboard from suggestions
    const keyboard = buildInlineKeyboard(suggestions);

    // Split if message is too long for Telegram (4096 char limit)
    const parts = splitLongMessage(htmlContent);

    // Send all parts; only the last part gets the suggestion keyboard
    for (let i = 0; i < parts.length; i++) {
      const isLastPart = i === parts.length - 1;
      await sendTelegramMessage(chatId, parts[i], {
        reply_markup: isLastPart ? keyboard : undefined,
      });
    }
  } catch (err) {
    console.error(`[Telegram] processAndReply error for chat ${chatId}:`, err);

    // Send error message in the user's language — no mixing
    await sendTelegramMessage(chatId, localized(ERROR_MESSAGES, chatId)).catch(() => {});
  }
}
