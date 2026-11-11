# Ach Gadol - Lone Soldier Rights Platform

AI-powered platform helping lone soldiers (Chayalim Bodedim) in the IDF navigate their rights, entitlements, and bureaucratic processes. Built for the Ach Gadol organization.

- Development history: [DEVELOPMENT.md](DEVELOPMENT.md)
- Security model and known limitations: [SECURITY.md](SECURITY.md)

## What it does

A lone soldier has no family in Israel to navigate the bureaucracy for them, and the
entitlements they are owed are scattered across several government bodies in documents
written only in Hebrew. The platform answers questions about those entitlements in the
soldier's own language, citing the official source for every figure it gives.

- **Multilingual assistant** — ask in any of 7 languages and get an answer grounded in the
  rights data, with links to the official source page.
- **Rights catalogue** — the full set of entitlements, each with eligibility conditions
  and the procedure for claiming it.
- **Eligibility check** — a rules engine that takes a soldier's profile and returns the
  entitlements that apply to them.
- **Reachable off the web** — the same assistant is available over Telegram, because not
  every soldier will visit a website. A WhatsApp handler exists but is not enabled.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Anthropic Claude (answer generation), OpenAI (embeddings)
- **Channels**: Telegram webhook; WhatsApp handler present but not deployed
- **i18n**: Hebrew (default), English, Russian, Amharic, French, Spanish, Arabic
- **Deployment**: Vercel; a Dockerfile is included for running it elsewhere

Supabase is used purely as a Postgres database with the pgvector extension. Supabase Auth,
Storage and Edge Functions are not used — the product has no user accounts.

## How the assistant actually works

**Where the knowledge comes from.** Most of what the assistant knows is not retrieved at
runtime: it lives in `lib/rag/prompts.ts` as a structured reference block covering lone
soldier categories, the recognition process, and the monthly and one-off benefits, with
every figure checked against idf.il, hachvana.mod.gov.il and the Ach Gadol rights guide.
That block is included in the system prompt on every request. The knowledge base in
Postgres supplements it.

**Retrieval.** The question is embedded with OpenAI `text-embedding-3-small`. The pipeline
then loads every embedded chunk from `kb_chunks` into memory — cached for five minutes per
serverless instance — and ranks them by cosine similarity computed in JavaScript.

This is deliberately simple and is honest about its limits: it works because the knowledge
base is small, and it would not survive growth. A `match_kb_chunks` SQL function and an
ivfflat index already exist in `db/migrations/001_match_kb_chunks.sql` for the point where
loading every embedding per instance stops being reasonable; the pipeline does not call it
today.

**Multilingual retrieval.** Embedding a Russian or Amharic question against a
Hebrew-and-English knowledge base produces systematically lower similarity scores. Rather
than translating every query first — which added a round trip and risked the function
timeout — the pipeline applies a lower similarity threshold for non-Hebrew/English queries.

**Accuracy over fluency.** The assistant is constrained to cite official government
sources, and the prompt instructs it to describe a benefit rather than quote an exact
figure where possible, and to tell the soldier to confirm with their welfare officer
(מש״קית ת״ש). Getting an amount wrong is worse than saying "I don't know" — a soldier may
act on it.

**Confidence.** The model is asked to end its answer with a `[[CONFIDENCE:0.XX]]` marker.
While streaming, the pipeline buffers output so the marker is never shown to the user, then
parses it from the completed text. If knowledge-base context was used and the answer cites
sources, the value is floored at 0.7. So confidence is a self-report by the model, read
after generation — not an independent measurement.

**Follow-up suggestions.** If the answer arrives without them, a second, cheaper model call
generates two or three, skipped if the request has already taken over 40 seconds.

## Project Structure

```
ach-gadol/
  db/
    schema.sql          # Database schema
    seed.sql            # Sample knowledge base documents
    setup_all.sql       # Combined setup
    migrations/         # Incremental schema changes
  frontend/
    src/
      app/[locale]/     # i18n routes (home, chat, rights, check, resources, about)
      app/api/          # chat, kb embed, health, Telegram + WhatsApp webhooks
      lib/rag/          # pipeline, embeddings, prompts, language detection
      lib/channels/     # Telegram + WhatsApp handlers
      lib/supabase/     # client, server, admin, generated types
      lib/security.ts   # constant-time comparison, admin guard
      lib/eligibility.ts
      messages/         # 7 locale files
    Dockerfile
    vercel.json
    .env.example
```

## Setup

### 1. Database

Create a Supabase project, then run the combined setup file via the SQL editor or CLI:

```bash
psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres -f db/setup_all.sql
```

Or apply `schema.sql`, `seed.sql` and `migrations/` individually.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in your keys in .env.local

npm install
npm run dev
```

Open http://localhost:3000.

### 3. Knowledge base

`db/seed.sql` inserts a few sample documents. To embed chunks that have no embedding yet:

```bash
curl -X POST https://<host>/api/kb/embed -H "Authorization: Bearer $ADMIN_API_KEY"
```

### 4. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anonymous key (public by design) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-side only. Bypasses RLS — never expose |
| `ANTHROPIC_API_KEY` | yes | Claude API key (server-side) |
| `OPENAI_API_KEY` | yes | OpenAI key for embeddings (server-side) |
| `ADMIN_API_KEY` | yes | Bearer token for `/api/kb/embed` and `/api/health/deep` |
| `SESSION_SECRET` | recommended | Signs the chat session cookie. Falls back to the service-role key |
| `ANTHROPIC_ANSWER_MODEL` | no | Overrides the answer model (default `claude-sonnet-5-5`) |
| `ANTHROPIC_REPAIR_MODEL` | no | Overrides the follow-up model (default `claude-haiku-5-5`) |
| `TELEGRAM_BOT_TOKEN` | for Telegram | Bot token from @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | for Telegram | Required — the webhook rejects traffic without it |
| `WHATSAPP_ACCESS_TOKEN` | for WhatsApp | WhatsApp Cloud API token |
| `WHATSAPP_PHONE_NUMBER_ID` | for WhatsApp | Sending phone number id |
| `WHATSAPP_VERIFY_TOKEN` | for WhatsApp | Webhook verification token |
| `WHATSAPP_APP_SECRET` | for WhatsApp | Required — used to verify the request signature |

Never commit `.env.local`. It is gitignored.

## API

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/chat/send` | session cookie | Chat, server-sent events stream |
| `GET /api/health` | public | Liveness only |
| `GET /api/health/deep` | `ADMIN_API_KEY` | Full diagnostics |
| `POST /api/kb/embed` | `ADMIN_API_KEY` | Embed chunks missing an embedding |
| `POST /api/webhooks/telegram` | shared secret header | Telegram updates |
| `POST /api/webhooks/whatsapp` | HMAC signature | WhatsApp events (not enabled) |

## Deployment

### Vercel

```bash
cd frontend
vercel --prod
```

Set environment variables under Project Settings → Environment Variables. Changes require
a redeploy to take effect.

### Docker

```bash
cd frontend
docker build -t ach-gadol .
docker run -p 3000:3000 --env-file .env.local ach-gadol
```

## License

Private - Ach Gadol Organization
