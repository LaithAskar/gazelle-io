# Gazelle.io — Security Audit

**Date:** 2026-06-27
**Scope:** Full repo — Supabase RLS, web auth, API routes, secret handling, the three AI agents (Tutor / Planner / Curriculum), and the content-filter pipeline.
**Reviewer:** Claude Code (automated security review)

---

## TL;DR

The fundamentals are in good shape. The most dangerous mistakes for an AI app —
leaking your secret API keys into the phone app or browser, or leaving the
database wide open — were **not** found. Your service-role key is server-side
only (with a runtime guard), no secrets are committed to git, and row-level
security is enabled on every table.

The real exposure is different from the classic "hacker steals your data"
story. For this app it's mostly: **anyone on the internet can sign up and run
up your Anthropic/Voyage AI bill**, and the **child-safety content filter is
easy to slip past**. Neither is catastrophic, but both should be closed before
real users (and real children) are on the platform.

Nothing here is an emergency. None of it requires re-running migrations.

---

## What's already done right ✅

- **No secrets in the repo.** `.gitignore` correctly excludes `.env*`; a scan of
  all tracked files found no API keys, tokens, or service-role keys.
- **Service-role key is server-only.** It's never imported into the web client,
  and `createServiceRoleClient()` throws if it's ever reached from a browser
  context. Env validation splits client-safe (`NEXT_PUBLIC_*`) from server-only
  keys at the type level.
- **Row-Level Security (RLS) is on for all 12 tables**, with sensible
  owner-scoped policies. `curriculum_knowledge` and `agent_logs` have no client
  policies at all (service-role only) — correct.
- **Every API route checks authentication** before doing work, and the
  lesson-approve route double-checks teacher ownership (`teacher_id` match) on
  top of RLS.
- **No XSS sinks.** No `dangerouslySetInnerHTML`, `innerHTML`, or `eval` in the
  web app; React escapes rendered values by default.
- **AI output is gated.** Every agent logs to `agent_logs` as `pending`, runs a
  content filter, and the Tutor falls back to a safe message if its feedback is
  rejected — so a child never sees raw, unreviewed model output.

---

## Findings (ranked by real-world risk)

### 1. No rate limiting on the AI endpoints → bill/abuse risk — **HIGH**

`/api/lessons/generate`, `/api/insights`, and `/api/lessons/[id]/approve` each
trigger expensive Claude + Voyage calls. There is no per-user or per-IP rate
limit. Any logged-in user can call them in a tight loop and run your API spend
up fast. Combined with finding #2 (open signup), *anyone on the internet* can do
this. This is the most likely way this app actually gets "hacked" in the
TikTok-clip sense — not data theft, but cost abuse.

**Fix:** Add a simple per-user rate limit (e.g. N generations per minute/day) on
the three agent routes. A small in-memory or Supabase-backed counter is enough
for the MVP; a managed limiter (Upstash) later. *Adding a library needs
architect approval per CLAUDE.md — flagging, not adding.*

### 2. Open self-service signup + self-assigned "teacher" role — **MEDIUM**

Signup is public and email auto-confirm is on, so anyone can create a working
account with no invite and no email verification. The `users_insert_own` RLS
policy lets a user insert their own row with **any `role` they choose**,
including `teacher`. For an MVP meant for 100 *invited* US users, the front door
is currently open to the whole internet — which is also what makes #1
exploitable by strangers.

**Fix options (product decision — needs your call):**
- Gate signup behind an invite code / allowlist for the closed beta, **or**
- Turn email auto-confirm back off, **and**
- Constrain the `role` a user can self-assign (don't trust client-supplied role).

### 3. AI prompt-injection + weak content filter — **MEDIUM** (the AI-specific one)

This is the "hack the AI" angle from the video.

- **Untrusted text is concatenated straight into prompts.** A student's answer
  (`studentAnswer`) and a teacher's topic/objectives are dropped directly into
  the model prompt with no separation. A user can try classic injections
  ("ignore your instructions and…"). Blast radius is *limited* today because the
  Tutor only returns structured JSON and rejected feedback is replaced with a
  safe message — but the design relies entirely on the output filter holding.
- **The output filter is naive keyword/regex.** It's easily evaded (spacing,
  synonyms, unicode, misspellings) and also false-positives on legitimate
  lessons (e.g. "Civil War" → `violence`, a Bible-history lesson → `religious`).
  For a child-facing product this is the highest-stakes filter in the app.

**Fix:** (a) Wrap untrusted input in clear delimiters and instruct the model to
treat it as data, not instructions. (b) Post-MVP, upgrade the strict
(child-facing) filter to an LLM moderation pass instead of keyword matching —
this is already noted as a known limitation in the code comments.

### 4. Raw student input stored unfiltered (COPPA/PII) — **MEDIUM**

The content filter scans agent *output* for PII, but a student's raw answer is
written verbatim into `session_responses.response_data` and later shown to the
teacher/parent. If a 7-year-old types their phone number or home address into an
answer box, it's stored as-is. For a K-6 product under COPPA, raw child input is
the sensitive bit.

**Fix:** Run the same PII scan over student input before storing it (redact or
flag), not just over model output.

### 5. No HTTP security headers / CSP — **LOW–MEDIUM**

`next.config.mjs` sets no security headers. Adding a Content-Security-Policy,
`X-Frame-Options: DENY` (anti-clickjacking), `X-Content-Type-Options: nosniff`,
and HSTS is cheap defense-in-depth.

**Fix:** Add a `headers()` block to `next.config.mjs`. Low-risk, additive.

### 6. Internal error messages returned to the client — **LOW**

The agent routes return `e.message` directly (`{ error: e.message }`), which can
leak internal/DB details. Log the detail server-side; return a generic message
to the client.

### 7. Forward-looking: privileged Tutor functions trust their `studentId` — **INFO**

`startTutorSession`, `submitResponse`, etc. run with the service role and act on
whatever `studentId` they're handed, with **no check that the caller owns that
student**. No endpoint exposes them today (the iOS app is Phase 5, unbuilt), so
this isn't exploitable now — but when you wire these to iOS, the endpoint
**must** verify the authenticated parent owns the student, or it's an IDOR
(one parent reading/altering another child's session). Noting it now so it's not
missed later.

---

## Recommended order of work

1. **#1 Rate limiting** + **#2 lock down signup** — together these close the
   "stranger runs up my bill" hole. Highest priority.
2. **#3 / #4** — prompt-injection hardening + filter student input. Child-safety.
3. **#5 / #6** — security headers + error sanitization. Quick, low-risk wins.
4. **#7** — keep in mind for the iOS phase.

Items #5 and #6 are safe, additive changes I can make right away. Items #1–#4
touch product behavior (or need a new library / a Supabase setting change), so
they need your sign-off first per the project's checkpoint rule.
