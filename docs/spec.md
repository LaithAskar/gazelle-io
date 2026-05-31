# Gazelle.io — Product Specification Document
**Version:** 0.2 MVP
**Last Updated:** May 2026
**Author:** Laith (Architect) — Agent-assisted build
**Status:** Pre-build. Agents do not deviate from this spec without architect review.
> Reconstructed from the original planning conversation. The live Supabase schema is the authoritative data model — if this doc and the database disagree, the database wins and this doc should be corrected.
---
## 1. Product Overview
**Gazelle.io** is an AI-powered adaptive learning platform for K-6 students. It serves three user types — students, parents, and teachers — through two frontends: a native iOS app (students/parents) and a web dashboard (teachers). Three embedded AI agents drive the core experience, backed by a RAG knowledge base built from open source curriculum content.
**Mission:** Make personalized, curriculum-aligned learning accessible to every K-6 student regardless of classroom resources.
**MVP target:** 100 free users in the US. Zero monetization logic in v1.
---
## 2. Users
| Role | Platform | Description |
|------|----------|-------------|
| Student | iOS | K-6, ages 5–12. Primary learner. Has no direct auth account. |
| Parent | iOS | Creates and owns the student account, monitors progress, reviews content. |
| Teacher | Web (Next.js) | Builds lesson plans, uploads curriculum, views class-wide analytics. |
---
## 3. Tech Stack — Locked. Agents Do Not Change This.
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Mobile | Swift (SwiftUI) | iOS student/parent app |
| Web | Next.js 14 + React + TypeScript | Teacher dashboard |
| Deployment | Vercel | Web frontend + API routes |
| Backend/DB | Supabase | Auth, Postgres, Storage, Edge Functions, Realtime |
| Vector Store | Supabase pgvector | RAG knowledge base for agents |
| Agent Framework | Mastra (TypeScript, self-hosted on Vercel) | All three agents |
| AI Model | claude-sonnet-4 | Agent LLM backbone (confirm current model string before build) |
| Embeddings | Voyage AI `voyage-3.5` (1024 dims) | RAG embeddings — replaces spec's nonexistent "Anthropic embeddings API" |
| Scraping | Apify | Open source curriculum ingestion only |
| Monorepo | Turborepo | iOS + web + packages in one repo |
---
## 4. Data Model
The authoritative schema lives in Supabase (already initialized) and in `docs/supabase/migrations/001_initial_schema.sql`. Tables in the schema:
- `users` — id, email, role (student | parent | teacher), timestamps
- `teacher_profiles` — user_id, name, school, state
- `parent_profiles` — user_id, name
- `student_profiles` — parent_id, teacher_id, name, grade (1–6), age (5–13), pace (slow | medium | fast), strength_subjects[], struggle_subjects[]
- `curriculum_standards` — source, grade, subject, code, (description, etc.)
- `curriculum_knowledge` — embedded curriculum chunks (pgvector) for RAG
- `lesson_plans` — teacher-generated plans, with a `status` field (draft | approved | active)
- `questions` — generated question bank tied to lesson plans
- `sessions` — student practice sessions
- `session_responses` — individual answers within a session
- `agent_logs` — every agent output, logged with `status` (pending → approved) before reaching a user
- `insight_reports` — weekly class-level reports for teachers
Key relationships: a student is owned by a parent (`parent_id`) and optionally linked to a teacher (`teacher_id`). Students never have a direct auth account — all student data is owned by the parent record.
> Verify exact columns against the live database. Do not re-run migrations.
---
## 5. RAG Pipeline ("machine learning the agents")
This is RAG via pgvector — NOT model fine-tuning.
1. Apify scrapes approved sources on a schedule
2. Raw content is chunked into ~500 token segments
3. Each chunk is embedded via Voyage AI `voyage-3.5` (1024 dims) — the original "Anthropic embeddings API" does not exist; corrected 2026-05-30
4. Chunks stored in the `curriculum_knowledge` table with pgvector
5. Agents query by semantic similarity before generating any response
**Approved scraping sources — these only, no exceptions:**
- corestandards.org
- achievethecore.org
- oercommons.org
- State DOE public pages
No Khan Academy scraping (ToS prohibits it). Apply for their API post-MVP.
---
## 6. The Three Agents
All agents built with Mastra (TypeScript, self-hosted). All use claude-sonnet-4. All outputs logged to `agent_logs` with status `pending` before surfacing to users.
### 6.1 Tutor Agent
**Where:** iOS app — live during student practice sessions
**Purpose:** Real-time adaptive tutoring
**Responsibilities:**
- Generate age-appropriate questions from the active lesson plan
- Adapt difficulty in real time based on responses
- Give encouraging, non-punishing feedback on wrong answers
- Summarize sessions for parent review
- Query the RAG knowledge base for curriculum-accurate explanations
**Hard Guardrails:**
- Language level matched to grade (Flesch-Kincaid reference)
- No violent, political, religious, or adult content
- Off-topic or concerning student input → warm redirect, no engagement
- Max response: 3 sentences (grades 1–2), 5 sentences (grades 3–6)
- No raw chat logs stored — structured session data only
- All outputs pass a content filter before reaching the student
**Mastra Tools:**
- `get_active_lesson_plan(student_id)`
- `get_student_profile(student_id)`
- `search_curriculum_knowledge(query, grade, subject)` ← RAG
- `log_session_response(session_id, response_data)`
- `generate_question(lesson_id, difficulty, grade)`
- `flag_session_for_review(session_id, reason)`
### 6.2 Planner Agent
**Where:** Web dashboard — teacher lesson plan builder
**Purpose:** Fast, curriculum-aligned lesson plan generation
**Responsibilities:**
- Accept teacher input (topic, grade, objectives, duration)
- Pull relevant standards from the RAG knowledge base
- Generate a structured lesson plan (hook → instruction → practice → assessment)
- Accept teacher edits, regenerate specific sections on request
- Convert approved plans into a student question bank
**Hard Guardrails:**
- All plans saved as `status: 'draft'` — teacher must explicitly approve
- Never auto-publish to students
- Flag if output doesn't map to any curriculum standard
- Every generation logged with teacher_id and timestamp
**Mastra Tools:**
- `search_curriculum_standards(grade, subject, keywords)` ← RAG
- `search_curriculum_knowledge(query, grade, subject)` ← RAG
- `generate_lesson_plan(input)`
- `save_lesson_plan_draft(plan)`
- `generate_question_bank(lesson_plan_id)`
- `get_teacher_lesson_history(teacher_id)`
### 6.3 Curriculum Agent
**Where:** Server-side — Supabase Edge Functions, scheduled + event-triggered
**Purpose:** Background intelligence layer connecting teacher content to student performance
**Responsibilities:**
- Ingest curriculum content via Apify on schedule
- Embed content into the RAG knowledge base
- Analyze student session data across a class
- Surface at-risk students to the teacher dashboard
- Generate weekly insight reports for teachers
- Keep the standards database current
**Hard Guardrails:**
- Read-only access to student session data
- Class-wide reports are aggregated — no individual PII in summaries
- Apify jobs run on schedule only — no on-demand (avoids rate issues)
- Scraped content validated before ingestion
- Only the approved source list (Section 5) — no exceptions
**Mastra Tools:**
- `run_apify_scrape(source, grade_range)`
- `chunk_and_embed_content(raw_content)`
- `ingest_to_knowledge_base(chunks)`
- `analyze_class_performance(teacher_id, timeframe)`
- `generate_insight_report(teacher_id)`
- `detect_at_risk_students(class_id)`
---
## 7. Core User Flows
### Student Flow (iOS)
1. Parent creates account → creates student profile (grade, name)
2. Student opens app → greeted by name, sees today's lesson
3. Session starts → Tutor Agent queries RAG + generates first question
4. Student answers → agent adapts difficulty in real time
5. Session ends → student sees encouragement only; parent gets full structured report
### Teacher Flow (Web)
1. Teacher signs up → creates a class
2. Opens Lesson Planner → inputs topic, grade, objectives
3. Planner Agent queries RAG → generates a lesson plan
4. Teacher edits and approves
5. Approved plan pushed to linked students
6. Teacher views dashboard → Curriculum Agent weekly report
### Parent Flow (iOS)
1. Views child's session history
2. Reviews Tutor Agent structured summaries
3. Optionally uploads custom questions
4. Receives weekly progress digest
---
## 8. COPPA Compliance — Non-Negotiable
- No PII collected from students under 13 without verifiable parental consent
- Parent creates and owns the student account — student never inputs personal data directly
- No behavioral advertising, no third-party analytics on student data
- Data minimization: store only what the product needs to function
- Right to deletion: parent can delete all student data at any time; deletion cascades to all student records
- All student data encrypted at rest in Supabase
- Session response logs purged after 90 days unless parent opts into extended retention
- No raw student chat stored — structured data only
---
## 9. MVP Scope
**In scope (v1):**
- Student adaptive practice sessions (Tutor Agent)
- Teacher lesson plan generation (Planner Agent)
- RAG knowledge base from open source curriculum
- Common Core standard ingestion via Apify (Curriculum Agent)
- Class performance reporting (Curriculum Agent)
- Parent progress view
- iOS app (SwiftUI)
- Teacher web dashboard (Next.js)
- Supabase auth, database, vector store
- Mastra agents self-hosted on Vercel
**Out of scope (v1):**
- Android app
- In-app payments or subscriptions
- Video or audio content
- Live tutoring / human-in-the-loop sessions
- Khan Academy integration (pending API review)
- Gamification (points, badges)
- Multi-language support
- State-specific standards beyond Common Core
---
## 10. Agent Review Protocol
Every agent output goes through this before reaching a user:
1. Agent generates output → logged to Supabase `agent_logs` with status `pending`
2. Output passes a content filter (age-appropriate, on-topic, no PII)
3. Status updated to `approved` → surfaced to user
4. Architect spot-checks logs weekly during the MVP phase
5. Any flagged output reviewed manually before similar generations resume
---
## 11. Repository Structure
```
gazelle/
├── apps/
│   ├── ios/                   # SwiftUI iOS app
│   └── web/                   # Next.js 14 teacher dashboard
├── packages/
│   ├── agents/                # Mastra agent definitions
│   │   ├── tutor/
│   │   ├── planner/
│   │   └── curriculum/
│   ├── db/                    # Supabase client + typed queries
│   ├── rag/                   # Chunking, embedding, ingestion pipeline
│   └── shared/                # Shared TypeScript types across packages
├── scripts/
│   └── apify/                 # Curriculum scraping jobs
└── docs/
    ├── spec.md                # This document
    ├── cowork-brief.md        # Build contract
    └── supabase/              # Setup guide + SQL reference
```
---
## 12. Resolved Decisions
| Decision | Resolution |
|----------|-----------|
| Khan Academy scraping | Not in MVP. Apply for their API post-MVP. Apify uses approved open sources only. |
| State standards beyond Common Core | Common Core only for MVP. TEKS = first post-MVP priority. |
| Mastra cloud vs self-hosted | Self-hosted on Vercel. |
| Agent framework | Mastra (not custom, not LangChain). |
| Grade range | Full K-6. |
| Platforms | iOS only for MVP (student/parent). Web for teachers. Android post-MVP. |
| Apple Developer account | Purchase after local testing confirms a satisfactory MVP. |
| "Machine learning the agents" | RAG via pgvector, not fine-tuning. |
| Supabase initialization | Done by architect manually. See `docs/supabase/SUPABASE_SETUP.md`. Do not re-run migrations. |
---
*This document is the source of truth for product detail. Agents build to this spec. The architect reviews before any code is merged or deployed.*
