# Ach Gadol - Lone Soldier Rights Platform

AI-powered platform helping lone soldiers (Chayalim Bodedim) in the IDF navigate their rights, entitlements, and bureaucratic processes. Built for the Ach Gadol organization.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **AI**: Anthropic Claude (chat + reasoning), OpenAI (embeddings)
- **Vector Search**: pgvector on Supabase
- **i18n**: Hebrew (default), English, Russian, Amharic, French, Spanish, Arabic
- **Deployment**: Vercel (frontend), Supabase (backend)

## Project Structure

```
ach-gadol/
  db/
    schema.sql       # Full database schema (run on Supabase)
    seed.sql         # Test data: users, rules, KB docs, glossary
  frontend/
    src/
      app/[locale]/  # i18n routes
    vercel.json      # Vercel rewrites for locale routing
    .env.example     # Environment variable template
```

## Setup

### 1. Database

Create a Supabase project, then run the schema and seed files:

```bash
# Via Supabase SQL Editor or CLI
psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres -f db/schema.sql
psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres -f db/seed.sql
```

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

## Deployment

### Vercel (Frontend)

```bash
cd frontend
vercel --prod
```

Set environment variables in the Vercel dashboard under Project Settings > Environment Variables.

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
