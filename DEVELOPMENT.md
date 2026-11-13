# Development History

This document records how Ach Gadol was built. The commit history on GitHub covers
only the first three days of work; development continued for two more weeks locally
without being committed. This file reconstructs the full timeline from the git log
and from file modification timestamps in the working tree, so the record is complete.

**Active development window: 27 Feb 2026 – 15 Mar 2026.**

---

## Phase 1 — Foundation and RAG chatbot
**27 Feb – 1 Mar 2026 · 58 commits · fully in git history**

The core of the platform was built in an intensive three-day push.

| Date | Work |
|---|---|
| 27 Feb | Project scaffold (Next.js 14 App Router, Tailwind, TypeScript). Supabase integration, initial schema, `match_kb_chunks` migration for pgvector search. i18n routing for 7 languages. |
| 28 Feb | Visual identity aligned to achgadol.org. The bulk of the RAG chatbot: KB vector search with in-app cosine-similarity fallback, embedding-string parsing fix, multilingual similarity thresholds, streaming responses, citation links to source pages, response caching and parallelisation. Chat UI rebuilt several times to land on a clean layout. A first pass at API hardening — input validation and an admin key on the embedding endpoint. Webhook signature verification was begun but left incomplete, and several routes still had no authentication; see SECURITY.md for what was actually closed, and when. |
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
| Commits from that sprint | 58 (27 Feb – 1 Mar) |
| Working days with changes after the last commit | 7 (2, 3, 4, 5, 7, 14, 15 Mar) |
| Source files in the project (excluding dependencies) | ~60 |
| Languages supported | 7 (he, en, ru, am, fr, es, ar) |

## A note on the commit history

Four things about this repository's history should be stated plainly, because an
inaccurate record is worse than an incomplete one.

**The author field was re-attributed on 10 November 2026.** The commits from the
February–March sprint were originally recorded under the development machine's default
git identity — the macOS account name on the computer the work was done on — because no
`user.name` or `user.email` had been configured in that checkout. On 10 November 2026 the
history was rewritten with `git filter-repo` so every commit carries a single, correct
author, and the result was force-pushed. The commit dates and the content of every commit
are unchanged; only the author field differs from what was originally recorded.

That machine was a shared family computer, and the identity git picked up was its macOS
account rather than mine. No other person contributed code to this repository. Most of
the code was generated with Claude Code, as described in "How this was built" below.

**Phases 2–4 below were never committed at the time.** Their dates come from file
modification timestamps in the working tree, not from git. That work was committed on
10 November 2026, in commits carrying that date — they are not backdated, and the
contribution graph reflects when the commits were made rather than when the work was done.
This document exists to record the difference.

**The `Co-Authored-By` trailer was applied inconsistently before 13 November 2026.**
Fourteen commits carry no trailer: `3039cac`, `38a4989`, `637b051`, `cc967a3`, `49305c4`,
`44fe26c`, `e7fbee3`, `db2fd90`, `10b6bec`, `fea76ef`, `27324cc`, `4a9d2af`, `3cc264e`,
`ee99128`. Among them is `4a9d2af`, the security remediation that this document describes
as carried out with Claude Code. The trailer was not added retroactively, because doing so
would mean rewriting published history. Commits from 13 November 2026 onward carry it.

**An internal QA audit report was removed from the working tree on 13 November 2026.**
`frontend/QA_AUDIT_REPORT.md` was an AI-generated QA pass dated 3 March 2026, covering
test cases, a simulated evaluation of the bot and a ranked risk list. It is deliberately
not carried forward, because it describes amounts and behaviour that have since changed
and it was never reviewed with Ach Gadol. It remains readable in git history at commit
`ee99128`.

## How this was built (AI-assisted)

This project was built with Claude Code. Claude generated most of the code and assisted
with architecture, integrations, documentation and fixes. Commits it contributed to carry
a `Co-Authored-By: Claude` trailer.

The requirements came from Ach Gadol staff, who set out what lone soldiers need and which
rights the assistant had to cover. The technical decisions were mine: the Next.js and
Supabase stack, grounding every answer in a curated knowledge base with citations rather
than fine-tuning the model, and keeping eligibility in a deterministic rules engine kept
separate from the language model. The rights content, the amounts and the source links
were checked with Ach Gadol before they went live.

The security review recorded in `SECURITY_REMEDIATION.md` was carried out by Claude Code.
I reviewed the findings and confirmed the fixes.
