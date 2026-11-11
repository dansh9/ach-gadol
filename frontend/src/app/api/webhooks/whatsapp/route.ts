import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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
    // Integration disabled — nothing configured, nothing to do.
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      return NextResponse.json({ ok: true });
    }

    /* AG-SEC-01: fail CLOSED. Previously the handler only checked that the
     * signature header existed, and skipped verification entirely when no app
     * secret was set — so anyone who knew the URL could forge Meta events,
     * drive paid AI calls and make the bot message arbitrary numbers. */
    if (!WHATSAPP_APP_SECRET) {
      console.error("WHATSAPP_APP_SECRET is not set — refusing webhook traffic");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    // The raw bytes must be read BEFORE parsing: the HMAC covers the exact body.
    const rawBody = await request.text();

    if (rawBody.length > 1_000_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const signature = request.headers.get("x-hub-signature-256");
    if (!signature || !signature.startsWith("sha256=")) {
      return NextResponse.json({ error: "Missing signature" }, { status: 403 });
    }

    const expected =
      "sha256=" +
      crypto.createHmac("sha256", WHATSAPP_APP_SECRET).update(rawBody).digest("hex");

    const given = Buffer.from(signature);
    const want = Buffer.from(expected);
    if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
    }

    // Extract messages from webhook payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = (body as any).entry?.[0];
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
