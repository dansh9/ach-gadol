# Ach Gadol - Lone Soldier Rights Platform

AI-powered platform helping lone soldiers (Chayalim Bodedim) in the IDF navigate their rights, entitlements, and bureaucratic processes. Built for the Ach Gadol organization.

Live demo: https://frontend-swart-chi-12.vercel.app

Security model and known limitations: [SECURITY.md](SECURITY.md)

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
  every soldier will visit a website. A WhatsApp webhook handler is included but
  is not configured.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Anthropic Claude (answer generation), OpenAI (embeddings)
- **Channels**: Telegram webhook; WhatsApp handler included but not configured
- **i18n**: Hebrew (default), English, Russian, Amharic, French, Spanish, Arabic
- **Deployment**: Vercel; a Dockerfile is included for running it elsewhere

Supabase is used purely as a Postgres database with the pgvector extension. Supabase Auth,
Storage and Edge Functions are not used — the product has no user accounts.

## How the assistant works

No model was trained or fine-tuned for this project. It uses existing hosted models —
Claude for answers, an OpenAI embedding model for retrieval — and grounds each answer in
the organisation's material through the system prompt and retrieved context.

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
act on it. This reduces the risk of a wrong answer; it does not guarantee correctness, and
the information is general guidance rather than legal advice.

**Confidence.** The model is asked to end its answer with a `[[CONFIDENCE:0.XX]]` marker.
While streaming, the pipeline buffers output so the marker is never shown to the user, then
parses it from the completed text. If knowledge-base context was used and the answer cites
sources, the value is floored at 0.7. So confidence is the model's own estimate, read after
generation — not a calibrated statistical measure.

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
| `POST /api/webhooks/whatsapp` | HMAC signature | WhatsApp events (not configured) |

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

## Tests and CI

The frontend has automated unit tests for request payload construction and eligibility
calculations. From the repository root:

```bash
cd frontend
npm ci
npm test
npm run lint
npm run typecheck
```

The [GitHub Actions workflow](.github/workflows/ci.yml) runs these checks on pushes and
pull requests. It needs no production API keys. These checks do **not** prove that
Telegram delivery, external AI providers, the deployed site, or the security model work
end-to-end. A production build can also be run locally with `npm run build` once the
necessary environment is configured.

## Engineering choices, lessons, and one open limitation

**Why these tools?** Next.js lets the multilingual website and its API/webhook handlers
share one TypeScript project. Postgres holds structured rights and conversation data;
Supabase and pgvector leave room for semantic search as the knowledge base grows. Instead
of training a model, the assistant uses curated official-source information and retrieved
context. The eligibility rules remain deterministic code rather than asking a language
model to calculate entitlement amounts.

**What changed during development?** Reviewing the project revealed places where
security must be enforced at the server boundary, not trusted to the client: the browser
cannot choose someone else's chat session id, administrative routes must reject missing
credentials, and webhooks must verify provider secrets/signatures. Another lesson is that
citing an official source lowers the risk of a wrong answer but does not guarantee
accuracy. The current retrieval approach deliberately favors simplicity for a small
knowledge base over premature search infrastructure.

**What remains to fix?** The Telegram webhook currently waits for the AI pipeline and
message delivery inside a serverless request with a 60-second maximum duration. A slow
model response or provider call can exceed that budget. A more robust design would
acknowledge the webhook promptly, place the work in a durable queue, process it
asynchronously with bounded timeouts, and deduplicate provider retries. This design is
not implemented yet. Other known security and operational limitations are listed in
[SECURITY.md](SECURITY.md).

## How this was built

This project was built with Claude Code. Claude generated most of the code and assisted
with architecture, integrations, documentation and fixes. Claude-assisted commits from 13 November 2026
onward use a `Co-Authored-By: Claude` trailer when applicable; earlier ones are inconsistent, which
[DEVELOPMENT.md](DEVELOPMENT.md) records.

[DEVELOPMENT.md](DEVELOPMENT.md) also records the phase-by-phase history and four facts
about the commit record: the author field was re-attributed on 10 November 2026, the
February to March work was committed later than it was done, an AI-generated QA report
was removed from the working tree on 13 November 2026 and is still readable in history,
and the co-author trailer was applied inconsistently before that date.
[SECURITY_REMEDIATION.md](SECURITY_REMEDIATION.md) covers the security review and the
fixes it produced.


Documentation and CI edits on 14 November 2026 were prepared with ChatGPT. They do not
change the chatbot's runtime code.

## License

Private - Ach Gadol Organization
