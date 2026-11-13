# Security

## Threat model

Ach Gadol is a public chatbot with no user accounts. Anyone can open the site or message
the Telegram bot. Behind it sit paid AI APIs, a Postgres database holding conversation
history, and inbound webhooks from Telegram and WhatsApp.

That shape produces four risks worth designing against:

1. **Conversation confidentiality.** Soldiers describe personal financial and family
   circumstances. One visitor must never be able to read another's conversation.
2. **Forged webhooks.** An endpoint that accepts unauthenticated events lets an attacker
   drive paid model calls and make the bot send messages from the organisation's accounts.
3. **Denial of wallet.** Any unauthenticated route that calls a paid API can be looped.
4. **Knowledge-base integrity.** Withdrawn or unpublished material must not surface in
   answers, because people act on what the assistant tells them.

There is no authentication system to attack, no payment data, and no personal records
beyond the conversations themselves.

## What is protected, and how

**Chat sessions.** The conversation id is never read from the request body. The server
issues an HttpOnly, Secure, SameSite=Lax cookie containing `<uuid>.<hmac-sha256>`, signed
with `SESSION_SECRET` (falling back to the service-role key, which never leaves the
server). Only a value this server signed is accepted, compared in constant time. Sending
`{"reset": true}` abandons the current session and issues a new one.

**Telegram webhook.** Requires `TELEGRAM_WEBHOOK_SECRET`. Without it the endpoint returns
503 rather than accepting traffic. The `x-telegram-bot-api-secret-token` header is
compared in constant time.

**WhatsApp webhook.** Requires `WHATSAPP_APP_SECRET`, and returns 503 without it. The raw
body is read before parsing, the `sha256=` HMAC is verified with a constant-time
comparison, and payloads above 1 MB are rejected.

**Admin endpoints.** `/api/health/deep` and `/api/kb/embed` require
`Authorization: Bearer <ADMIN_API_KEY>` via the shared `requireAdmin` helper, which fails
closed if the key is unset or shorter than 16 characters and returns no detail on failure.
The public `/api/health` returns `{"status":"ok"}` and makes no outbound calls.

**Database.** As defined in `db/schema.sql`, RLS is enabled on all four tables. `chat_sessions` and `chat_messages` have
no anon policies — only the server's service-role client reaches them. `kb_documents` and
`kb_chunks` allow anonymous reads, as they hold published reference material about IDF
entitlements. The service-role key is server-side only and never reaches the browser.

**Knowledge base.** The RAG pipeline loads only documents where `is_active = true`, and
drops any chunk whose parent document is not in that set, so withdrawn material cannot
reach a generated answer.

**Secrets.** No credential is committed. `.gitignore` covers `.env*` with an explicit
exception for `.env.example`, plus key, certificate and credential-file patterns. The
Telegram bot token is redacted from diagnostic output.

**Models.** Model ids live in one place and are overridable by environment variable, so a
provider retirement is a configuration change rather than a code change.

## Known limitations

- **Rate limiting is per serverless instance.** Both limiters use an in-memory `Map`, so a
  new instance starts with empty counters and the limit does not hold across the
  deployment. A distributed limiter is the correct fix and has not been built.
- **Webhook events are not deduplicated.** A provider retry can trigger a second model
  call and a second reply.
- **No retention policy.** `chat_messages` keeps full conversation content indefinitely,
  and the browser keeps a copy in `sessionStorage`. Neither is purged.
- **The `anon` policy on `kb_chunks` is `USING (true)`.** A chunk belonging to an inactive
  document is still readable by direct Supabase access, even though the application path
  filters it. The content is public reference material, so this is a correctness gap
  rather than a confidentiality breach, but the policy should be tightened.
- **Next.js 14.x is no longer patched.** Some advisories have fixes only in 15.5.28 and
  16.4.1. The image optimizer, the subject of the most severe of them, is disabled
  (`images.unoptimized`) because the app does not use `next/image`; upgrading to 15.x is
  the remaining fix.
- **No automated security tests or CI.** The controls above were verified by hand.

## Reporting

If you find a security issue, open an issue on the repository without including exploit
details or any credential you may have found.
