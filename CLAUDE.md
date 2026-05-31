# CLAUDE.md — Gazelle.io
> This file is read by Claude Code at the start of every session. It is the single source of truth for project context, locked decisions, and build rules. Keep it concise and current. If anything here conflicts with `docs/spec.md`, the spec wins on *product detail* — but the **Locked Decisions** and **Do NOT Do** sections below override everything.
---
## What Gazelle.io Is
Gazelle.io is an AI-powered adaptive learning platform for K-6 students (ages 5–12). It serves three user types — **students, parents, and teachers** — across two frontends: a native iOS app (students/parents) and a Next.js web dashboard (teachers). Three embedded AI agents drive the core experience, backed by a RAG knowledge base built from open source curriculum content.
**MVP target:** 100 free users in the US. Zero monetization logic in v1.
---
## Your Role (Claude Code)
You are the contractor. The architect (Laith) has already made every major decision. Your job is to **implement them cleanly and flag anything ambiguous — not resolve it yourself.**
**When in doubt: stop and ask. Do not guess. Do not invent.**
The architect reviews every phase before the next phase begins. Checkpoint after each phase.
---
## Read Order (do this first, every fresh session)
1. `CLAUDE.md` (this file)
2. `docs/cowork-brief.md` — the phase-by-phase build contract
3. `docs/spec.md` — full product specification (source of truth for product detail)
Confirm you've read all three and summarize the key constraints back before doing anything.
---
## Tech Stack — LOCKED. Do Not Change.
| Layer | Technology |
|-------|-----------|
| iOS App | Swift, SwiftUI |
| Web Dashboard | Next.js 14, React, TypeScript |
| Deployment | Vercel |
| Database / Auth / Storage | Supabase (already initialized) |
| Vector Store | Supabase pgvector (already enabled) |
| Agent Framework | Mastra (TypeScript, self-hosted on Vercel — NOT Mastra cloud) |
| AI Model | claude-sonnet-4 via Anthropic API |
| Scraping | Apify |
| Monorepo | Turborepo |
| Languages | TypeScript (backend/web), Swift (iOS) — no mixing |
Do not introduce new libraries, frameworks, or tools without explicit architect approval. If you think something is missing, **flag it — don't add it.**
> Note for the architect: confirm the current Anthropic model string before the first agent build — model identifiers change over time, and the spec was written against `claude-sonnet-4`.
---
## The Three Agents
| Agent | Where it lives | What it does |
|-------|----------------|--------------|
| **Tutor** | iOS app | Real-time adaptive questioning and feedback during student sessions |
| **Planner** | Web dashboard | Generates curriculum-aligned lesson plans from teacher input |
| **Curriculum** | Server-side (Supabase edge functions) | Ingests open source standards, analyzes class performance, generates weekly reports |
All three agents query a shared RAG knowledge base. The three agents communicating through Supabase is the product's core differentiator. **Every agent output logs to `agent_logs` with status `pending` before any user sees it** — outputs are filtered before reaching users.
---
## Repository Structure
```
gazelle/
├── CLAUDE.md                  # This file
├── README.md
├── .env.example               # Every required key, empty values
├── apps/
│   ├── ios/                   # SwiftUI iOS app (student/parent)
│   └── web/                   # Next.js 14 teacher dashboard
├── packages/
│   ├── agents/
│   │   ├── tutor/
│   │   ├── planner/
│   │   └── curriculum/
│   ├── db/                    # Supabase client + typed queries
│   ├── rag/                   # Chunking, embedding, ingestion pipeline
│   └── shared/                # TypeScript types shared across packages
├── scripts/
│   └── apify/                 # Curriculum scraping jobs
└── docs/
    ├── spec.md                # Full product specification (v0.2)
    ├── cowork-brief.md        # Agent build contract
    └── supabase/
        ├── SUPABASE_SETUP.md
        ├── migrations/001_initial_schema.sql
        ├── rls/002_rls_policies.sql
        └── storage/003_storage_buckets.sql
```
---
## Locked Decisions (the conversation context that isn't in the spec)
- First 100 users are free. **No monetization in v1.**
- **iOS only** for MVP. Android is post-MVP.
- **Mastra self-hosted on Vercel.** Not Mastra cloud.
- **Common Core only** for MVP. TEKS is the first post-MVP addition (Texas = 2nd largest market).
- "Machine learning the agents" means **RAG via pgvector** — NOT fine-tuning.
- Apify scrapes **open source / public domain only**: corestandards.org, achievethecore.org, oercommons.org, and state DOE public pages. **No Khan Academy scraping** — apply for their API post-MVP instead.
- Apple Developer account is purchased **after** local testing confirms the MVP is satisfactory.
- **Supabase is already initialized** — schema, RLS policies, and storage buckets are done. **Do NOT re-run migrations.**
- Full K-6 grade range (the peak developmental years).
---
## Do NOT Do (the most important section)
- **Do not re-run Supabase migrations.** The database is already set up. Touching migrations risks wiping live setup.
- **Never put the Supabase service role key anywhere client-facing.** It is server-side only — never in the iOS app, never in browser/client code. If you ever find it client-side, stop and flag it immediately.
  - Anon key → `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe in Next.js client + iOS)
  - Service role key → `.env.local` as `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- **Do not commit `.env.local`** or any real keys/tokens.
- **Do not add unapproved libraries or frameworks.** Flag, don't add.
- **Do not run all build phases in one shot.** Checkpoint with the architect between every phase.
- **Do not scrape Khan Academy or any non-approved source.**
- **Do not skip the `agent_logs` → `pending` → filter step** for any agent output.
---
## Environment Variables
Copy `.env.example` to `.env.local` and fill in real values locally. Required keys include the Supabase URL + anon key + service role key, the Anthropic API key, and (post-MVP) the Apify API key. `.env.example` holds the full list with empty values — reference it rather than guessing what env vars exist.
---
## Current Status
- Supabase: **schema, RLS, and storage applied & verified 2026-05-30.** The live project (`gazelle-io`, ref `dnxoosoiukvprclmkyuc`) was found EMPTY despite the original handoff claiming it was initialized — the schema was authored from the spec, reviewed by the architect, and applied. 12 tables, pgvector v0.8.0, RLS on all 12 tables, 2 private storage buckets. The SQL files in `docs/supabase/` are now authoritative and match the live DB. **Do NOT re-run them.**
- Embedding provider: **Voyage AI `voyage-3.5` (1024 dims)** — supersedes the spec's nonexistent "Anthropic embeddings API." Requires `VOYAGE_API_KEY`.
- Grade encoding: **0–6 where 0 = Kindergarten** (honors "Full K-6"; the original partial SQL's `1–6` excluded K).
- Repo: ready for Turborepo scaffold.
- Build: **not started.** First step is the scaffold below.
Update this section as phases complete.
---
## First Action
Scaffold the Turborepo monorepo structure from the layout above — **folder structure and config files only. No package installs, no logic.** Then stop and wait for architect approval before Phase 1 begins.
