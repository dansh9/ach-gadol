# Ach Gadol - Lone Soldier Rights Platform

AI-powered platform helping lone soldiers (Chayalim Bodedim) in the IDF navigate their rights, entitlements, and bureaucratic processes. Built for the Ach Gadol organization.

Development history and timeline: [DEVELOPMENT.md](DEVELOPMENT.md)

## What it does

A lone soldier has no family in Israel to navigate the bureaucracy for them, and the
entitlements they are owed are scattered across several government bodies in documents
written only in Hebrew. The platform answers questions about those entitlements in the
soldier's own language, citing the official source for every figure it gives.

- **Multilingual assistant** — ask in any of 7 languages, get an answer grounded in the
  knowledge base with links to the official source page.
- **Rights catalogue** — the full set of entitlements, each with eligibility conditions
  and the procedure for claiming it.
- **Eligibility check** — a rules engine that takes a soldier's profile and returns the
  entitlements that apply to them.
- **Reachable off the web** — the same assistant is available over Telegram and WhatsApp,
  because not every soldier will visit a website.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI**: Anthropic Claude (chat + reasoning), OpenAI (embeddings)
- **Vector Search**: pgvector on Supabase
- **Channels**: Telegram and WhatsApp webhooks via a shared handler
- **i18n**: Hebrew (default), English, Russian, Amharic, French, Spanish, Arabic
- **Deployment**: Vercel (frontend), Supabase (backend), Docker image available

## Architecture notes

**Retrieval.** Questions are embedded (OpenAI) and matched against knowledge-base chunks
stored as pgvector embeddings in Supabase, via the `match_kb_chunks` function. If the
database-side vector search is unavailable the pipeline falls back to in-app cosine
similarity, so the assistant degrades rather than fails.

**Multilingual retrieval.** Embedding a Russian or Amharic question against a
Hebrew-and-English knowledge base produces systematically lower similarity scores. Rather
than translating every query first — which added a round trip and risked Vercel's function
timeout — the pipeline applies a lower similarity threshold for non-Hebrew/English queries.

**Accuracy over fluency.** Every financial figure in the system prompt is verified against
its official source (idf.il, hachvana.mod.gov.il, misrad haklita) and the assistant is
constrained to cite only official government sources. Getting a benefit amount wrong is
worse than saying "I don't know" — a soldier may act on it.

**Streaming with a confidence floor.** Responses stream token-by-token. Confidence is
computed before streaming begins and floored when knowledge-base context is present, so a
partially-rendered answer never displays a confidence value that the finished answer
contradicts.

## Project Structure

```
ach-gadol/
  db/
    schema.sql          # Full database schema (run on Supabase)
    seed.sql            # Test data: users, rules, KB docs, glossary
    setup_all.sql       # Combined setup (schema + seed + migrations)
    migrations/         # Incremental schema changes
  frontend/
    src/
      app/[locale]/     # i18n routes (home, chat, rights, check, resources, about)
      app/api/          # chat, kb embed/search, health, Telegram + WhatsApp webhooks
      lib/rag/          # pipeline, embeddings, prompts, language detection
      lib/channels/     # Telegram + WhatsApp handlers
      lib/supabase/     # client, server, admin, generated types
      lib/eligibility.ts
      messages/         # 7 locale files
    Dockerfile
    vercel.json         # Vercel rewrites for locale routing
    .env.example        # Environment variable template
```

## Setup

### 1. Database

Create a Supabase project, then run the combined setup file:

```bash
# Via Supabase SQL Editor or CLI
psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres -f db/setup_all.sql
```

Or apply `schema.sql`, `seed.sql` and `migrations/` individually.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in your Supabase and API keys in .env.local

npm install
npm run dev
```

Open http://localhost:3000 to view the app.

### 3. Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `ANTHROPIC_API_KEY` | Claude API key (server-side) |
| `OPENAI_API_KEY` | OpenAI API key for embeddings (server-side) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (optional, for the Telegram channel) |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook verification token (optional) |

Never commit `.env.local`. It is gitignored.

## Deployment

### Vercel (Frontend)

```bash
cd frontend
vercel --prod
```

Set environment variables in the Vercel dashboard under Project Settings > Environment Variables.

### Docker

```bash
cd frontend
docker build -t ach-gadol .
docker run -p 3000:3000 --env-file .env.local ach-gadol
```

### Supabase (Database)

The database schema is deployed directly to your Supabase project. Use the Supabase CLI or SQL Editor to apply migrations.

## Test Accounts (Seed Data)

| Name | Role | Language |
|---|---|---|
| Daniel Cohen | Soldier | Hebrew |
| Sarah Johnson | Soldier | English |
| Alexey Petrov | Soldier | Russian |
| Yael Levi | Volunteer | Hebrew |
| Michael Barak | Volunteer | Hebrew |
| Ronit Shemesh | Admin | Hebrew |

## License

Private - Ach Gadol Organization
