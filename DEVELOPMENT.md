# Development History

This document records how Ach Gadol was built. The commit history on GitHub covers
only the first three days of work; development continued for two more weeks locally
without being committed. This file reconstructs the full timeline from the git log
and from file modification timestamps in the working tree, so the record is complete.

**Active development window: 27 Feb 2026 – 15 Mar 2026.**

---

## Phase 1 — Foundation and RAG chatbot
**27 Feb – 1 Mar 2026 · 59 commits · fully in git history**

The core of the platform was built in an intensive three-day push.

| Date | Work |
|---|---|
| 27 Feb | Project scaffold (Next.js 14 App Router, Tailwind, TypeScript). Supabase integration, initial schema, `match_kb_chunks` migration for pgvector search. i18n routing for 7 languages. |
| 28 Feb | Visual identity aligned to achgadol.org. The bulk of the RAG chatbot: KB vector search with in-app cosine-similarity fallback, embedding-string parsing fix, multilingual similarity thresholds, streaming responses, citation links to source pages, response caching and parallelisation. Chat UI rebuilt several times to land on a clean layout. API security hardening (auth, validation, webhook verification). |
| 1 Mar | Rights page redesign. System prompt rewritten as a case-assistant with a strict answer template. All Kol-Zchut links replaced with official government sources. Chat history persisted in `sessionStorage`. Every financial figure verified against idf.il and hachvana.mod.gov.il and corrected across `prompts.ts` and all 7 locale files. |

The last commit, `Verify and correct all financial amounts from official sources`,
was pushed on 1 Mar 2026 at 20:41. **Everything below this line was never committed.**

---

## Phase 2 — Deployment and messaging channels
**2 Mar – 5 Mar 2026 · not in git history**

| Date | Work | Files |
|---|---|---|
| 2 Mar | Containerisation and build configuration | `Dockerfile`, `.dockerignore`, `next.config.mjs`, `package-lock.json` |
| 3 Mar | Full QA audit of the platform (66 KB report), homepage / about / check page rework, global styles, Hebrew locale corrections | `QA_AUDIT_REPORT.md`, `globals.css`, `[locale]/page.tsx`, `about/page.tsx`, `check/page.tsx`, `messages/he.json` |
| 4 Mar | Messaging channel layer — Telegram bot integration and a shared channel handler so the assistant can be reached outside the web app | `lib/channels/telegram.ts`, `lib/channels/handler.ts`, `.env.example` |
| 5 Mar | RAG pipeline and embeddings refinement, health-check endpoint, Vercel routing configuration | `lib/rag/pipeline.ts`, `lib/rag/embeddings.ts`, `api/health/route.ts`, `vercel.json` |

---

## Phase 3 — Eligibility engine and content accuracy
**7 Mar 2026 · not in git history**

The largest single body of content work in the project.

- `lib/eligibility.ts` (16 KB) — rules engine determining which entitlements apply
  to a given soldier profile.
- `lib/rag/prompts.ts` (47 KB) — the full system-prompt corpus across all languages.
- `app/[locale]/rights/page.tsx` (50 KB) — the complete rights catalogue.

---

## Phase 4 — Database restructure and API hardening
**14 Mar – 15 Mar 2026 · not in git history**

| Date | Work | Files |
|---|---|---|
| 14 Mar | Schema rework, unused tables dropped, seed and combined setup script rebuilt, Supabase types regenerated | `db/schema.sql`, `db/seed.sql`, `db/setup_all.sql`, `db/migrations/003_drop_unused_tables.sql`, `lib/supabase/types.ts` |
| 15 Mar | Chat send endpoint and Telegram webhook reworked against the new schema | `api/chat/send/route.ts`, `api/webhooks/telegram/route.ts` |

---

## Summary

| | |
|---|---|
| Active development window | 27 Feb – 15 Mar 2026 |
| Commits in git history | 59 (27 Feb – 1 Mar) |
| Working days with changes after the last commit | 7 (2, 3, 4, 5, 7, 14, 15 Mar) |
| Source files in the project (excluding dependencies) | ~60 |
| Languages supported | 7 (he, en, ru, am, fr, es, ar) |

## A note on the commit history

The commits were made with git's default local identity on the machine used for
development, which resolved to the macOS account name on that computer rather than
to a configured author. The identity on the existing commits therefore reflects the
machine account, not necessarily the author.

Work after 1 Mar 2026 was done locally without commits. The dates in Phases 2–4 are
taken from file modification timestamps in the working tree, which is why this
document exists: it is the honest record of a development period that git did not
capture. The commits that bring this work into the repository carry the date they
were actually made, not backdated dates.
