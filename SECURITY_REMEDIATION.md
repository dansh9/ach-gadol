# Security Remediation

Response to the security audit of `dansh9/ach-gadol` dated 2026-11-10.
Each finding was verified against the working tree before any change was made;
two were found to be overstated and are recorded as such.

| ID | Finding | Status |
|---|---|---|
| AG-SEC-01 | WhatsApp webhook signature not verified | **Fixed** |
| AG-SEC-02 | Chat session IDOR | **Fixed** |
| AG-SEC-03 | Public KB search bypasses RLS | **Fixed** (endpoint deleted) |
| AG-SEC-04 | `anon` RLS policy on `kb_chunks` | Accepted risk — see below |
| AG-SEC-05 | Inactive KB documents reach public answers | **Fixed** |
| AG-SEC-06 | Unauthenticated health endpoint makes billable calls | **Fixed** |
| AG-SEC-07 | Telegram webhook fails open without a secret | **Fixed** |
| AG-SEC-08 | Rate limiting not shared across instances | **Partially fixed** |
| AG-SEC-09 | Next.js 14.2.21 vulnerable | **Fixed** (14.2.35) |
| AG-SEC-10 | Dockerfile on end-of-life Node 18 | **Fixed** (Node 22) |
| AG-SEC-11 | `.gitignore` misses some `.env` variants | **Fixed** |
| AG-SEC-12 | Webhook replay not durably deduplicated | Open |
| AG-SEC-13 | Chat retention policy | Open — product decision |
| AG-SEC-14 | No security regression tests or CI | Open |
| AG-SEC-15 | Supabase project reference in SQL comment | **Fixed** |
| — | Vercel CLI present as a production dependency | **Fixed** (not in the audit) |

---

## Fixed

### AG-SEC-02 — Chat session IDOR
`/api/chat/send` accepted a client-supplied `sessionId` and used it directly
against a service-role Supabase client, which bypasses RLS. Anyone who learned
another visitor's session UUID could have that conversation's history loaded
into the model context, and could append messages to it. For a service used by
lone soldiers discussing personal financial and family circumstances, that is
the most serious issue in the audit.

The session id is now never read from the request body. The server issues an
HttpOnly, Secure, SameSite=Lax cookie containing `<uuid>.<hmac-sha256>`, signed
with `SESSION_SECRET` (falling back to the service-role key, which never leaves
the server). Only a value this server signed is accepted, compared in constant
time. `{ "reset": true }` abandons the current session and issues a new one.

Accepted `channel` and `language` values are now restricted to known sets.

### AG-SEC-01 — WhatsApp webhook signature
The handler previously checked only that the `x-hub-signature-256` header was
*present*, and skipped verification altogether when no app secret was set — a
literal `TODO` in the source. It now fails closed: without
`WHATSAPP_APP_SECRET` the endpoint returns 503. The raw body is read before
parsing, the `sha256=` HMAC is verified with `timingSafeEqual`, payloads above
1 MB are rejected, and malformed JSON returns 400.

### AG-SEC-07 — Telegram webhook
Same fail-open shape: verification was wrapped in `if (TELEGRAM_SECRET)`. The
endpoint now returns 503 when the secret is unset, and compares the header in
constant time.

### AG-SEC-06 — Health endpoint
`/api/health` was calling OpenAI and Anthropic on every anonymous GET — any
visitor could run up provider charges — and disclosed configured-secret names,
upstream error bodies, available models and the Telegram webhook configuration.

The public response is now `{ status, timestamp }` and nothing else, with no
upstream calls. Full diagnostics require `?key=` matching `HEALTH_DIAG_KEY`
(minimum 16 characters), compared in constant time; if that variable is unset
the diagnostics are unavailable. The Telegram bot token is redacted from any
output.

### AG-SEC-03 — Public KB search
`/api/kb/search` had no authentication, used the service-role client, returned
raw chunk text and metadata, and applied no `is_active` filter. It was also
dead code: nothing in the application called it — the RAG pipeline queries
Supabase directly. Deleted rather than secured.

### AG-SEC-05 — Inactive documents in RAG context
The pipeline loaded every embedded chunk and every document with no
`is_active` predicate, so withdrawn material could surface in generated
answers. Document loading now filters on `is_active = true`, and a chunk whose
parent document is not in that set is dropped during cache construction rather
than being relabelled "Unknown" and kept.

### AG-SEC-09 / AG-SEC-10 — Dependencies and runtime
Next.js 14.2.21 → 14.2.35, which patches
[GHSA-5j59-xgg2-r9c4](https://github.com/vercel/next.js/security/advisories/GHSA-5j59-xgg2-r9c4)
(CVE-2025-67779, CVSS 7.5): a crafted request to a Server Function endpoint can
spin the React Server Components runtime in an infinite loop. `eslint-config-next`
moved to match. The Docker base image moved from end-of-life `node:18-alpine`
to `node:22-alpine`.

### Not in the audit — Vercel CLI as a production dependency
`package.json` listed `"vercel": "^65.14.0"` under `dependencies`, added when
the CLI self-upgraded inside the project directory. That pulls the entire
deployment CLI and its dependency tree into the production install. Removed.

### AG-SEC-11 / AG-SEC-15
`.gitignore` now uses `.env*` with an explicit `!.env.example` exception, plus
patterns for keys, certificates and credential files. The project-specific
Supabase dashboard URL in `db/setup_all.sql` was replaced with a
`<PROJECT_REF>` placeholder. Note this identifier is a project reference, not a
credential; no rotation is required for it.

---

## Partially fixed

### AG-SEC-08 — Rate limiting
Both limiters remain per-instance `Map`s, which bound a single serverless
instance rather than the deployment. The module-scope `setInterval` cleanup was
removed from both handlers — it never fires reliably in a serverless runtime —
and replaced with opportunistic pruning that also caps unbounded map growth.

A distributed limiter (Redis or a managed edge limiter) is still required for
real abuse protection and is deliberately out of scope here, as it introduces
infrastructure this project does not yet have.

---

## Accepted risk

### AG-SEC-04 — `anon` read policy on `kb_chunks`
The policy `FOR SELECT TO anon USING (true)` is real, and a chunk belonging to
an inactive document is readable through it. The knowledge base contains
published information about IDF lone-soldier entitlements, sourced from
idf.il and the Ach Gadol rights guide — public reference material, not private
data. The exposure is therefore a correctness issue rather than a
confidentiality breach, and the application path is now filtered (AG-SEC-05).

Tightening the policy to an `EXISTS` predicate over active documents remains
worthwhile and should be delivered as a reviewed migration.

---

## Open

- **AG-SEC-12** — webhook replay deduplication by `update_id` / Meta message id,
  in a durable store with a unique constraint.
- **AG-SEC-13** — retention and deletion policy for `chat_messages`, and the
  user-visible expectations that go with it.
- **AG-SEC-14** — regression tests for the denial cases above, and CI running
  build, lint, dependency audit and secret scanning.

---

## Operator actions required

These cannot be done in code and are listed without values:

1. Set `HEALTH_DIAG_KEY` in the Vercel project (16+ random characters) to
   re-enable the detailed diagnostics.
2. Set `SESSION_SECRET` in the Vercel project. Without it the chat session
   cookie is signed with the service-role key, which works but couples two
   unrelated secrets.
3. Set `WHATSAPP_APP_SECRET` before enabling the WhatsApp integration — the
   endpoint now refuses traffic without it.
4. Run `npm audit` on a local checkout and triage the full result; this
   remediation addressed the Next.js advisory specifically, not every
   transitive advisory.
5. Consider tightening the `anon` policy on `kb_chunks` as a migration.

No real secret value appears in this document, in the source, or in any commit
produced by this work.

## Verification performed

Changes were verified by build and by live checks against the deployment: the
public health endpoint returns liveness only, and the website chat and the
Telegram bot were exercised end to end. This is a code remediation verified by
targeted testing, not a penetration test, and production security should not be
considered proven on this basis alone.
