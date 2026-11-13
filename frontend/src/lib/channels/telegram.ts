/**
 * Telegram Bot API utilities.
 * Handles message sending, formatting, inline keyboards, and typing indicators.
 */

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Telegram callback_data has a 64-byte limit
const MAX_CALLBACK_DATA_BYTES = 64;

/* ===== Telegram API Calls ===== */

interface SendMessageOptions {
  reply_markup?: InlineKeyboardMarkup;
  parse_mode?: "HTML" | "Markdown";
}

interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

/**
 * Send a message to a Telegram chat.
 * Uses HTML parse_mode by default. Falls back to plain text if HTML parsing fails.
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options?: SendMessageOptions
): Promise<boolean> {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: options?.parse_mode ?? "HTML",
    disable_web_page_preview: true,
  };

  if (options?.reply_markup) {
    payload.reply_markup = options.reply_markup;
  }

  console.log(`[Telegram API] sendMessage to ${chatId}, text length=${text.length}, parse_mode=${payload.parse_mode}, has_keyboard=${!!options?.reply_markup}`);

  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // If HTML parsing fails, retry without parse_mode (plain text)
  if (!response.ok) {
    const errBody = await response.text();
    const status = response.status;
    console.error(`[Telegram API] sendMessage failed (${status}):`, errBody.slice(0, 300));

    if (status === 400 && errBody.includes("can't parse entities")) {
      console.warn("[Telegram API] HTML parse failed, falling back to plain text");
      const fallbackPayload: Record<string, unknown> = {
        chat_id: chatId,
        text: stripHtmlTags(text),
        disable_web_page_preview: true,
      };
      if (options?.reply_markup) {
        fallbackPayload.reply_markup = options.reply_markup;
      }

      const fallbackResponse = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fallbackPayload),
      });
      return fallbackResponse.ok;
    }

    console.error(`Telegram sendMessage error (${status}):`, errBody);
    return false;
  }

  return true;
}

/**
 * Send "typing..." indicator to show the bot is working.
 */
export async function sendTypingAction(
  chatId: number | string
): Promise<void> {
  await fetch(`${TELEGRAM_API}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(() => {
    // Non-critical — ignore errors
  });
}

/**
 * Acknowledge a callback query (removes the loading spinner on the button).
 */
export async function answerCallbackQuery(
  callbackQueryId: string
): Promise<void> {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  }).catch(() => {
    // Non-critical — ignore errors
  });
}

/* ===== Response Parsing ===== */

interface ParsedResponse {
  mainContent: string;
  suggestions: string[];
}

/**
 * Extract follow-up suggestions (lines starting with ">> ") from the bot reply.
 * Same logic as the web frontend's parseSuggestions().
 */
export function parseFollowUps(reply: string): ParsedResponse {
  const lines = reply.split("\n");
  const contentLines: string[] = [];
  const suggestions: string[] = [];

  for (const line of lines) {
    if (line.startsWith(">> ")) {
      suggestions.push(line.slice(3).trim());
    } else {
      contentLines.push(line);
    }
  }

  return {
    mainContent: contentLines.join("\n").trimEnd(),
    suggestions,
  };
}

/* ===== Inline Keyboard ===== */

/**
 * Build Telegram inline keyboard from suggestion strings.
 * Each suggestion becomes a button. callback_data is truncated to 64 bytes.
 */
export function buildInlineKeyboard(
  suggestions: string[]
): InlineKeyboardMarkup | undefined {
  if (suggestions.length === 0) return undefined;

  const buttons: InlineKeyboardButton[][] = suggestions.map((suggestion) => [
    {
      text: suggestion,
      callback_data: truncateToBytes(suggestion, MAX_CALLBACK_DATA_BYTES),
    },
  ]);

  return { inline_keyboard: buttons };
}

/**
 * Build language selection keyboard for /start.
 */
export function buildLanguageKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🇮🇱 עברית", callback_data: "lang:he" },
        { text: "🇺🇸 English", callback_data: "lang:en" },
      ],
      [
        { text: "🇷🇺 Русский", callback_data: "lang:ru" },
        { text: "🇪🇹 አማርኛ", callback_data: "lang:am" },
      ],
      [
        { text: "🇫🇷 Français", callback_data: "lang:fr" },
        { text: "🇪🇸 Español", callback_data: "lang:es" },
      ],
      [
        { text: "🇸🇦 العربية", callback_data: "lang:ar" },
      ],
    ],
  };
}

/* ===== Markdown → Telegram HTML Conversion ===== */

/**
 * Convert pipeline Markdown output to Telegram-safe HTML.
 * Handles: bold, italic, code, links, blockquotes, confidence markers.
 */
export function convertToTelegramHtml(markdown: string): string {
  let html = markdown;

  // Strip [[CONFIDENCE:...]] markers
  html = html.replace(/\[\[CONFIDENCE:[\d. ]+\]\]/g, "");

  // Escape HTML entities first (before adding our own tags)
  html = html.replace(/&/g, "&amp;");
  html = html.replace(/</g, "&lt;");
  html = html.replace(/>/g, "&gt;");

  // Restore >> suggestion lines (they were escaped)
  // These should already be stripped by parseFollowUps, but just in case
  html = html.replace(/^&gt;&gt; /gm, ">> ");

  // Links: [text](url) → <a href="url">text</a>
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>'
  );

  // Bold: **text** → <b>text</b>
  html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

  // Italic: *text* → <i>text</i> (but not inside bold tags)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<i>$1</i>");

  // Inline code: `text` → <code>text</code>
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Blockquotes: lines starting with > (after HTML escaping it's &gt;)
  html = html.replace(/^&gt;\s?(.*)$/gm, "▎ <i>$1</i>");

  // Clean up any double blank lines
  html = html.replace(/\n{3,}/g, "\n\n");

  return html.trim();
}

/* ===== Message Splitting ===== */

/**
 * Split a long message at paragraph boundaries to fit within Telegram's 4096-char limit.
 */
export function splitLongMessage(
  text: string,
  limit: number = 4096
): string[] {
  if (text.length <= limit) return [text];

  const parts: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    // Find the last paragraph break within the limit
    let splitIndex = remaining.lastIndexOf("\n\n", limit);

    // If no paragraph break, try a single newline
    if (splitIndex === -1 || splitIndex < limit * 0.3) {
      splitIndex = remaining.lastIndexOf("\n", limit);
    }

    // If still no good break, force split at limit
    if (splitIndex === -1 || splitIndex < limit * 0.3) {
      splitIndex = limit;
    }

    parts.push(remaining.slice(0, splitIndex).trimEnd());
    remaining = remaining.slice(splitIndex).trimStart();
  }

  if (remaining.length > 0) {
    parts.push(remaining);
  }

  return parts;
}

/* ===== Utility Helpers ===== */

/**
 * Truncate a string to fit within a byte limit (UTF-8).
 */
function truncateToBytes(str: string, maxBytes: number): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  if (bytes.length <= maxBytes) return str;

  // Truncate byte array and decode back (may cut a multi-byte char)
  const truncated = bytes.slice(0, maxBytes);
  const decoder = new TextDecoder("utf-8", { fatal: false });
  return decoder.decode(truncated).replace(/\uFFFD$/, ""); // Remove trailing replacement char
}

/**
 * Strip HTML tags for plain-text fallback.
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<a href="([^"]+)">([^<]+)<\/a>/g, "$2 ($1)") // Preserve links as text
    .replace(/<[^>]+>/g, ""); // Remove all other tags
}
