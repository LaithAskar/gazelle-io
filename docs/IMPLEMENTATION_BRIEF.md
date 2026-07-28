# Gazelle.io — Build Brief
**Owner:** Laith Askar
**Purpose:** Phase-by-phase implementation requirements and locked engineering decisions
**Version:** 1.0
This document records the implementation sequence and acceptance criteria.

---

## What Gazelle.io Is

Gazelle.io is an AI-powered adaptive learning platform for K-6 students (ages 5–12). It has three user types — students, parents, and teachers — served across two frontends: a native iOS app (SwiftUI) and a web teacher dashboard (Next.js). Three Mastra AI agents power the core experience, backed by a RAG knowledge base built from open source curriculum content. The full product specification lives at `docs/spec.md`. Read it.

---

## Decision ownership

Laith owns major product and architecture decisions. Ambiguities require explicit review rather than undocumented assumptions.

---

## Tech Stack — Final. Do Not Change It.

| Layer | Technology |
|-------|-----------|
| iOS App | Swift, SwiftUI |
| Web Dashboard | Next.js 14, React, TypeScript |
| Deployment | Vercel |
| Database / Auth / Storage | Supabase (already initialized — schema, RLS, storage buckets done) |
| Vector Store | Supabase pgvector (already enabled) |
| Agent Framework | Mastra (TypeScript, self-hosted on Vercel) |
| AI Model | claude-sonnet-4 (via Anthropic API) |
| Scraping | Apify |
| Monorepo | Turborepo |

Do not introduce new libraries, frameworks, or tools without explicit architect approval. If you think something is missing, flag it — don't add it.

---

## Build Order — Follow This Exactly

### Phase 1 — Shared Foundation
**Goal:** Everything else depends on this. Get it right before moving on.

1. `packages/shared` — TypeScript types for all data models (User, StudentProfile, LessonPlan, Question, Session, SessionResponse, CurriculumStandard, CurriculumKnowledge, AgentLog, InsightReport). Types must match the Supabase schema exactly — see `docs/spec.md` Section 4 and the live database.
2. `packages/db` — Supabase client wrapper with typed queries. One client for browser (anon key), one for server (service role key). Export typed helper functions, not raw Supabase calls scattered everywhere.
3. Environment variable validation — use `zod` to validate all required env vars at startup for both web and agents. App should fail fast with a clear error if any key is missing.

**Done when:** Types compile cleanly, Supabase client connects, env validation works.

### Phase 2 — RAG Pipeline
**Goal:** Agents need curriculum knowledge before they can do anything useful.

1. `packages/rag` — pipeline that takes raw text, chunks it (~500 tokens), embeds via the Anthropic API, stores in the `curriculum_knowledge` table.
2. `scripts/apify` — scraping jobs for approved sources only: corestandards.org, achievethecore.org, oercommons.org, State DOE public pages. **No other sources.**
3. Verify semantic search works — given a query + grade + subject, returns relevant curriculum chunks.

**Done when:** Scrape → chunk → embed → store runs end to end. Semantic search returns relevant results.

### Phase 3 — Mastra Agents
**Goal:** Three agents, each with their tools, connected to RAG and Supabase. Build in this order:

**3a. Planner Agent** (teacher-facing, simpler to test)
- Tools: `search_curriculum_standards`, `search_curriculum_knowledge`, `generate_lesson_plan`, `save_lesson_plan_draft`, `generate_question_bank`, `get_teacher_lesson_history`
- All lesson plans saved as `status: 'draft'` — never auto-approve
- Every generation logged to `agent_logs`

**3b. Tutor Agent** (student-facing, strictest guardrails)
- Tools: `get_active_lesson_plan`, `get_student_profile`, `search_curriculum_knowledge`, `log_session_response`, `generate_question`, `flag_session_for_review`
- Language level matched to grade
- Max response: 3 sentences (grades 1–2), 5 sentences (grades 3–6)
- Zero tolerance for off-topic, adult, political, or religious content
- No raw student chat stored — structured session data only

**3c. Curriculum Agent** (background, server-side)
- Tools: `run_apify_scrape`, `chunk_and_embed_content`, `ingest_to_knowledge_base`, `analyze_class_performance`, `generate_insight_report`, `detect_at_risk_students`
- Runs on schedule via Supabase Edge Functions
- Read-only access to student data
- Aggregated reporting only — no individual student PII in class summaries

**Done when:** All three agents run, use RAG, log to `agent_logs`, and enforce their guardrails.

### Phase 4 — Web Dashboard (Next.js)
**Goal:** Teacher-facing interface.

Pages:
- `/auth` — sign up / sign in (Supabase Auth)
- `/dashboard` — class overview, at-risk student flags, latest insight report
- `/lessons` — lesson plan list with status (draft / approved / active)
- `/lessons/new` — Planner Agent interface (input → generate → edit → approve)
- `/lessons/[id]` — view/edit individual lesson plan
- `/students` — linked students, per-student session history

Design: clean, professional, functional. No flashy animations. Mobile-responsive but desktop-first. Tailwind CSS only — no additional CSS frameworks.

**Done when:** Teacher can sign up, create a lesson plan via Planner Agent, approve it, and view student session data.

### Phase 5 — iOS App (SwiftUI)
**Goal:** Student and parent-facing mobile experience.

Screens:
- Onboarding — parent creates account, creates student profile
- Home — student greeting, today's lesson
- Session — question display, answer input, Tutor Agent feedback
- Session Summary — encouragement for student, structured report for parent
- Parent Dashboard — session history, weekly progress digest
- Settings — account management, data deletion option (COPPA requirement)

Design: warm, friendly, age-appropriate. Large tap targets. No scores or failure language visible to the student. Progress framed positively at all times.

**Done when:** Parent can create a student, student can complete a session, parent can view the structured summary.

---

## Decisions You Cannot Make

If you encounter any of the following, **stop and flag to the architect:**
- Adding a library or tool not already in the stack
- Changing the database schema or RLS policies
- Adding a new agent or removing an existing one
- Changing which sources Apify is allowed to scrape
- Any decision about monetization, pricing, or user limits
- Anything involving student data handling not explicitly covered in the spec
- Choosing a UI component library (Tailwind only unless told otherwise)
- Changing the Mastra agent tool signatures
- Anything that would require changes to the Supabase setup that's already done

---

## COPPA Rules — Hard Constraints, Not Guidelines

- Students under 13 have no direct auth account — parent owns all student data
- Never store raw student conversation/chat logs
- Never expose individual student data in class-wide views
- Never use student data for anything outside the product's core function
- Parent data deletion request must cascade to all student records
- Service role key never touches client-side code (iOS or browser)

Violating any of these is not a bug — it's a legal problem. Flag immediately if unsure.

---

## Agent Output Review Protocol

Every agent output must:
1. Be written to `agent_logs` with `status: 'pending'` first
2. Pass a content filter check
3. Update to `status: 'approved'` before surfacing to any user

Do not skip this flow for any agent, even during development.

---

## Environment Variables

All required keys are in `.env.example` at the repo root. Every key in that file is required. The app validates them at startup via Zod — missing keys cause an immediate startup failure with a clear error, not a runtime crash later. Never hardcode keys. Never commit `.env.local` or `.env`.

---

## Definition of Done — Overall MVP

- [ ] All three agents running and logging correctly
- [ ] RAG pipeline ingesting from approved sources
- [ ] Teacher can create and approve a lesson plan end to end
- [ ] Student can complete a session end to end
- [ ] Parent can view session summary
- [ ] RLS verified — no cross-user data leakage
- [ ] All env vars validated at startup
- [ ] Zero hardcoded secrets
- [ ] Architect has reviewed and approved each phase before the next begins

---

*The spec is the source of truth. This brief is the build contract. When they conflict, flag it — don't resolve it yourself.*
