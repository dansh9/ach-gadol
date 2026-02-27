import { NextRequest, NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/channels/handler";
import { detectLanguage } from "@/lib/rag/language";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

/**
 * POST /api/webhooks/telegram
 * Telegram sends updates to this webhook when users message the bot.
 */
export async function POST(request: NextRequest) {
  try {
    if (!TELEGRAM_TOKEN) {
      return NextResponse.json(
        { error: "Telegram bot not configured" },
        { status: 503 }
      );
    }

    const update = await request.json();

    // Handle text messages only
    const message = update.message;
    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text;

    // Handle /start command
    if (text === "/start") {
      await sendTelegramMessage(
        chatId,
        "שלום! 👋 אני אח גדול, בוט AI לעזרה לחיילים בודדים.\n\nHello! I'm Ach Gadol, an AI assistant for lone soldiers.\n\nשאל אותי כל שאלה על זכויות, טפסים, או כל נושא אחר.\nAsk me anything about rights, forms, or any other topic."
      );
      return NextResponse.json({ ok: true });
    }

    // Detect language and process message
    const language = detectLanguage(text);

    const result = await handleIncomingMessage({
      externalId: String(chatId),
      text,
      channel: "telegram",
      language,
    });

    // Send response
    await sendTelegramMessage(chatId, result.text);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

async function sendTelegramMessage(
  chatId: number | string,
  text: string
): Promise<void> {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}
