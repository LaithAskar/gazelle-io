# Gazelle.io

AI-powered adaptive learning platform for K-6 students (ages 5–12). Three user types —
students, parents, teachers — across a native iOS app (SwiftUI) and a Next.js teacher
dashboard, powered by three Mastra AI agents over a Supabase + pgvector RAG knowledge base.

> Read `CLAUDE.md`, then `docs/cowork-brief.md`, then `docs/spec.md` before building.

## Monorepo layout

```
apps/
  web/                 # Next.js 14 teacher dashboard (Phase 4)
  ios/                 # SwiftUI student/parent app (Phase 5, not a JS workspace)
packages/
  shared/              # Shared TypeScript types
  db/                  # Supabase client + typed queries
  rag/                 # Chunk → embed → ingest pipeline (Voyage voyage-3.5, 1024-dim)
  agents/
    tutor/             # Tutor agent (iOS, student-facing)
    planner/           # Planner agent (web, teacher-facing)
    curriculum/        # Curriculum agent (server-side, scheduled)
scripts/
  apify/               # Curriculum scraping jobs (approved sources only)
docs/                  # Spec, build brief, Supabase setup + SQL
```

## Stack

Swift/SwiftUI · Next.js 14 · TypeScript · Turborepo (pnpm) · Vercel · Supabase
(Postgres + Auth + Storage + pgvector) · Mastra (self-hosted) · claude-sonnet-4 ·
Voyage AI embeddings · Apify.

## Setup

1. `cp .env.example .env.local` and fill in real values (never commit `.env.local`).
2. `pnpm install` (run from repo root once dependencies are added in Phase 1).
3. Supabase is already provisioned and verified — see `docs/supabase/`. **Do not re-run the migrations.**

## Build status

Phase 0 (monorepo scaffold) complete. See `CLAUDE.md` → Current Status for the live state.
