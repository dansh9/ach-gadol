import { NextRequest, NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/channels/handler";
import { detectLanguage } from "@/lib/rag/language";

const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET;

/**
 * GET /api/webhooks/whatsapp
 * WhatsApp Cloud API webhook verification.
 * Meta sends a GET request to verify the webhook URL.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST /api/webhooks/whatsapp
 * WhatsApp Cloud API sends message notifications here.
 */
export async function POST(request: NextRequest) {
  try {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      return NextResponse.json({ ok: true });
    }

    // Verify X-Hub-Signature-256 if app secret is configured
    if (WHATSAPP_APP_SECRET) {
      const signature = request.headers.get("x-hub-signature-256");
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 403 });
      }
      // Note: Full HMAC verification requires reading raw body;
      // for now we check that the header is present when the secret is configured.
      // TODO: Implement full HMAC-SHA256 verification with raw body
    }

    const body = await request.json();

    // Extract messages from webhook payload
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages) {
      return NextResponse.json({ ok: true });
    }

    for (const message of value.messages) {
      // Only handle text messages
      if (message.type !== "text") continue;

      const from = message.from; // phone number
      const text = message.text.body;

      // Detect language
      const language = detectLanguage(text);

      // Process through RAG pipeline
      const result = await handleIncomingMessage({
        externalId: from,
        text,
        channel: "whatsapp",
        language,
      });

      // Send response via WhatsApp Cloud API
      await sendWhatsAppMessage(from, result.text);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ ok: true }); // Always return 200
  }
}

async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<void> {
  await fetch(
    `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );
}
